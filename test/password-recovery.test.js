const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "jwt-test-secret-with-more-than-thirty-two-characters";
process.env.RECOVERY_SECRET = "recovery-test-secret-with-more-than-thirty-two-characters";

let handler = async () => ({ rows: [] });
const consultas = [];
const cliente = {
  async query(sql, args = []) {
    consultas.push({ sql, args });
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return { rows: [] };
    return handler(sql, args);
  },
  release() {}
};

const configPath = require.resolve("../src/config/database");
require.cache[configPath] = {
  id: configPath,
  filename: configPath,
  loaded: true,
  exports: {
    consultar: (sql, args = []) => cliente.query(sql, args),
    pool: { connect: async () => cliente }
  }
};

const recoveryUtil = require("../src/utils/recovery.util");
const recoveryService = require("../src/services/recuperacion.service");
const jwtUtil = require("../src/utils/jwt.util");
const autenticarJWT = require("../src/middlewares/auth.middleware");
const jsonwebtoken = require("jsonwebtoken");

const respuesta = () => ({
  code: 200,
  body: null,
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; }
});

test.beforeEach(() => {
  consultas.length = 0;
  handler = async () => ({ rows: [] });
});

test("genera secretos aleatorios y almacenable solo como HMAC", () => {
  const codigos = new Set(
    Array.from({ length: 20 }, () => recoveryUtil.generarCodigoRecuperacion())
  );
  assert.equal(codigos.size, 20);
  for (const codigo of codigos) {
    assert.match(codigo, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){4}$/);
    const hash = recoveryUtil.hashCodigoRecuperacion(codigo);
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert.notEqual(hash, codigo);
    assert.equal(
      hash,
      recoveryUtil.hashCodigoRecuperacion(codigo.replaceAll("-", "").toLowerCase())
    );
  }
  assert.match(recoveryUtil.generarTokenRecuperacion(), /^[A-Za-z0-9_-]{43}$/);
});

test("el JWT incorpora la versión vigente de sesión", () => {
  const token = jwtUtil.generarToken({
    id: "7",
    email: "usuario@example.com",
    rol: "administrador",
    versionSesion: 4
  });
  assert.equal(jsonwebtoken.decode(token).ver, 4);
});

test("rechaza un JWT emitido antes del cambio de contraseña", async () => {
  handler = async () => ({
    rows: [{
      id: "7",
      email: "usuario@example.com",
      rol: "administrador",
      activo: true,
      versionSesion: 2
    }]
  });
  const token = jwtUtil.generarToken({
    id: "7",
    email: "usuario@example.com",
    rol: "administrador",
    versionSesion: 1
  });
  const res = respuesta();
  await autenticarJWT(
    { get: () => `Bearer ${token}` },
    res,
    () => assert.fail("El JWT anterior no debe conservar acceso")
  );
  assert.equal(res.code, 401);
  assert.equal(res.body.mensaje, "La sesión fue revocada");
});

test("los códigos se entregan una vez y la base recibe solamente hashes", async () => {
  handler = async (sql) =>
    sql.includes("FROM public.usuarios")
      ? { rows: [{ id: "7" }] }
      : { rows: [] };

  const codigos = await recoveryService.generarCodigos("7", 3);
  assert.equal(codigos.length, 3);
  const inserciones = consultas.filter((item) =>
    item.sql.includes("INSERT INTO public.codigos_recuperacion")
  );
  assert.equal(inserciones.length, 3);
  inserciones.forEach((item, index) => {
    assert.match(item.args[1], /^[a-f0-9]{64}$/);
    assert.notEqual(item.args[1], codigos[index]);
  });
  assert.ok(consultas.some((item) => item.sql === "COMMIT"));
});

test("restablecer con token cambia el hash, revoca sesiones y consume mecanismos", async () => {
  handler = async (sql) => {
    if (sql.includes("FROM public.password_reset_tokens prt")) {
      return { rows: [{ id: "11", usuario_id: "7" }] };
    }
    return { rows: [] };
  };

  const token = recoveryUtil.generarTokenRecuperacion();
  await recoveryService.restablecerConToken({
    token,
    nuevaPassword: "NuevaClaveSegura2026!"
  });

  const cambio = consultas.find((item) =>
    item.sql.includes("UPDATE public.usuarios")
  );
  assert.ok(cambio.sql.includes("version_sesion = version_sesion + 1"));
  assert.match(cambio.args[0], /^\$2[aby]\$/);
  assert.ok(consultas.some((item) =>
    item.sql.includes("UPDATE public.password_reset_tokens")
  ));
  assert.ok(consultas.some((item) =>
    item.sql.includes("UPDATE public.codigos_recuperacion")
  ));
  assert.ok(consultas.some((item) => item.sql === "COMMIT"));
});
