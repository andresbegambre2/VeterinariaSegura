const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const { usuarios, resetUsuarios } = require("../src/data/usuarios");
const { generarPasswordHash, verificarPassword } = require("../src/utils/password.util");

const API_KEY = process.env.API_KEY_POSTMAN;
const api = (path) => request(app).post(path).set("X-API-Key", API_KEY);
const registro = {
  nombre: "Dra. Laura Gómez",
  email: "laura@veterinaria.com",
  password: "ClaveSegura2026!",
  rol: "veterinario"
};

test.beforeEach(resetUsuarios);

test("Lab 7: registro, duplicado, login y respuestas seguras", async () => {
  const creado = await api("/api/auth/registro").send(registro).expect(201);
  assert.equal(creado.body.usuario.passwordHash, undefined);
  assert.match(usuarios[0].passwordHash, /^\$2[aby]\$12\$/);

  await api("/api/auth/registro").send(registro).expect(409);

  const login = await api("/api/auth/login").send({ email: registro.email, password: registro.password }).expect(200);
  assert.equal(login.body.usuario.rol, "veterinario");
  assert.equal(JSON.stringify(login.body).includes("passwordHash"), false);

  await api("/api/auth/login").send({ email: registro.email, password: "PasswordIncorrecto" }).expect(401);
  await api("/api/auth/login").send({ email: "nadie@veterinaria.com", password: registro.password }).expect(401);
});

test("Lab 7: longitud, roles y mass assignment quedan bloqueados", async () => {
  await api("/api/auth/registro").send({ ...registro, password: "corta" }).expect(400);
  await api("/api/auth/registro").send({ ...registro, rol: "superadmin" }).expect(400);
  await api("/api/auth/registro").send({ ...registro, activo: false }).expect(400);
});

test("Lab 7: bcrypt genera salts distintos y reiniciar limpia usuarios", async () => {
  const [hashA, hashB] = await Promise.all([
    generarPasswordHash(registro.password),
    generarPasswordHash(registro.password)
  ]);
  assert.notEqual(hashA, hashB);
  assert.equal(await verificarPassword(registro.password, hashA), true);

  await api("/api/auth/registro").send(registro).expect(201);
  assert.equal(usuarios.length, 1);
  resetUsuarios();
  assert.equal(usuarios.length, 0);
});

test("Lab 7: autenticación también exige API Key", async () => {
  await request(app).post("/api/auth/registro").send(registro).expect(401, { mensaje: "API Key requerida" });
});
