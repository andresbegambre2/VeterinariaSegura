const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-solo-pruebas-veterinaria-con-longitud-suficiente-2026";
process.env.JWT_EXPIRES_IN = "1h";

const app = require("../src/app");
const swagger = require("../src/docs/swagger");
const { resetUsuarios } = require("../src/data/usuarios");

const API_KEY = process.env.API_KEY_POSTMAN;
const registro = {
  nombre: "Cliente Veterinaria",
  email: "jwt@veterinaria.com",
  password: "ClaveSegura2026!"
};
const post = (path) => request(app).post(path).set("X-API-Key", API_KEY);
const perfil = () => request(app).get("/api/auth/perfil").set("X-API-Key", API_KEY);

test.beforeEach(() => {
  resetUsuarios();
  process.env.JWT_EXPIRES_IN = "1h";
});

async function obtenerToken() {
  await post("/api/auth/registro").send(registro).expect(201);
  const respuesta = await post("/api/auth/login")
    .send({ email: registro.email, password: registro.password })
    .expect(200);
  return respuesta.body.token;
}

test("Lab 9: login genera JWT HS256 con payload mínimo", async () => {
  const token = await obtenerToken();
  assert.equal(typeof token, "string");
  const decodificado = jwt.decode(token, { complete: true });
  assert.equal(decodificado.header.alg, "HS256");
  assert.equal(decodificado.payload.sub, "1");
  assert.equal(decodificado.payload.email, registro.email);
  assert.equal(decodificado.payload.rol, "propietario");
  assert.equal(decodificado.payload.password, undefined);
  assert.equal(decodificado.payload.passwordHash, undefined);
  assert.ok(decodificado.payload.exp > decodificado.payload.iat);
});

test("Lab 9: perfil exige API Key y JWT válidos", async () => {
  const token = await obtenerToken();
  const respuesta = await perfil().set("Authorization", `Bearer ${token}`).expect(200);
  assert.deepEqual(respuesta.body.usuario, { id: 1, email: registro.email, rol: "propietario" });
  assert.ok(respuesta.body.clienteApi);

  await perfil().expect(401, { mensaje: "Token de autenticación requerido" });
  await request(app).get("/api/auth/perfil").set("Authorization", `Bearer ${token}`)
    .expect(401, { mensaje: "API Key requerida" });
  await perfil().set("Authorization", token).expect(401, { mensaje: "Formato de token inválido" });
});

test("Lab 9: rechaza JWT alterado y expirado", async () => {
  const token = await obtenerToken();
  const partes = token.split(".");
  partes[2] = `${partes[2][0] === "a" ? "b" : "a"}${partes[2].slice(1)}`;
  await perfil().set("Authorization", `Bearer ${partes.join(".")}`)
    .expect(401, { mensaje: "Token inválido" });

  resetUsuarios();
  process.env.JWT_EXPIRES_IN = "1ms";
  const expirado = await obtenerToken();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await perfil().set("Authorization", `Bearer ${expirado}`)
    .expect(401, { mensaje: "Token expirado" });
});

test("Lab 9: Swagger documenta API Key AND Bearer", () => {
  assert.equal(swagger.components.securitySchemes.BearerAuth.scheme, "bearer");
  assert.deepEqual(swagger.paths["/api/auth/perfil"].get.security, [
    { ApiKeyAuth: [], BearerAuth: [] }
  ]);
});
