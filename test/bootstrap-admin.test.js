const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../src/config/database");
const servicePath = require.resolve("../src/services/usuarios.service");

let scenario;
let calls;
let released;

const client = {
  async query(sql, params = []) {
    calls.push({ sql, params });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [] };
    }
    if (sql.includes("pg_advisory_xact_lock")) return { rows: [] };
    if (sql.includes("FROM public.usuarios u") && sql.includes("r.nombre = 'administrador'")) {
      return { rows: scenario.adminExists ? [{ id: "1", activo: true }] : [] };
    }
    if (sql.includes("FROM public.usuarios") && sql.includes("LOWER(email)")) {
      return { rows: scenario.emailExists ? [{ id: "7" }] : [] };
    }
    if (sql.includes("FROM public.roles") && sql.includes("activo = TRUE")) {
      return { rows: scenario.activeRole ? [{ id: "1" }] : [] };
    }
    if (sql.includes("INSERT INTO public.usuarios")) {
      return {
        rows: [{ id: "10", nombre: params[0], email: params[1], activo: true }]
      };
    }
    throw new Error(`Consulta no simulada: ${sql}`);
  },
  release() {
    released = true;
  }
};

require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: {
    consultar: async () => ({ rows: [] }),
    pool: { connect: async () => client },
    cerrarPool: async () => {}
  }
};

delete require.cache[servicePath];
const usuariosService = require("../src/services/usuarios.service");

beforeEach(() => {
  scenario = { adminExists: false, emailExists: false, activeRole: true };
  calls = [];
  released = false;
  process.env.ADMIN_NOMBRE = "Administrador de Prueba";
  process.env.ADMIN_EMAIL = "ADMIN@EXAMPLE.COM";
  process.env.ADMIN_PASSWORD = "ClaveSegura2026!";
});

test("no duplica ni modifica un administrador existente", async () => {
  scenario.adminExists = true;
  const result = await usuariosService.crearAdministradorInicial();

  assert.deepEqual(result, {
    creado: false,
    motivo: "ADMINISTRADOR_EXISTENTE"
  });
  assert.equal(calls.some(call => call.sql.includes("INSERT INTO")), false);
  assert.equal(calls.some(call => call.sql === "COMMIT"), true);
  assert.equal(released, true);
});

test("crea el primer administrador dentro de una transaccion", async () => {
  const result = await usuariosService.crearAdministradorInicial();
  const insert = calls.find(call => call.sql.includes("INSERT INTO public.usuarios"));

  assert.equal(result.creado, true);
  assert.equal(result.usuario.email, "admin@example.com");
  assert.match(insert.params[2], /^\$2[aby]\$/);
  assert.equal(calls.some(call => call.sql === "COMMIT"), true);
  assert.equal(calls.some(call => call.sql === "ROLLBACK"), false);
  assert.equal(released, true);
});

test("rechaza elevar un correo perteneciente a otro usuario", async () => {
  scenario.emailExists = true;

  await assert.rejects(
    usuariosService.crearAdministradorInicial(),
    /No se elevarán privilegios/
  );
  assert.equal(calls.some(call => call.sql.includes("INSERT INTO")), false);
  assert.equal(calls.some(call => call.sql === "ROLLBACK"), true);
  assert.equal(released, true);
});

test("valida las variables antes de abrir una conexion", async () => {
  delete process.env.ADMIN_PASSWORD;

  await assert.rejects(
    usuariosService.crearAdministradorInicial(),
    /ADMIN_PASSWORD/
  );
  assert.equal(calls.length, 0);
  assert.equal(released, false);
});
