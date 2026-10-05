const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.JWT_SECRET ||= "secreto-solo-pruebas-veterinaria-con-longitud-suficiente-2026";
process.env.JWT_EXPIRES_IN ||= "1h";
const app = require("../src/app");
const swagger = require("../src/docs/swagger");
const { usuarios, resetUsuarios } = require("../src/data/usuarios");

const API_KEY = process.env.API_KEY_POSTMAN;
const api = (path) => request(app).post(path).set("X-API-Key", API_KEY);
const base = {
  nombre: "Cliente Veterinaria",
  email: "cliente@veterinaria.com",
  password: "ClaveSegura2026!"
};

test.beforeEach(resetUsuarios);

test("Lab 8: Swagger no permite que el cliente defina el rol", () => {
  const esquema = swagger.components.schemas.RegistroUsuario;
  assert.equal(esquema.required.includes("rol"), false);
  assert.equal(esquema.properties.rol, undefined);
  assert.match(swagger.paths["/api/auth/registro"].post.description, /asignado por el servidor/i);
});

test("Lab 8: el registro público asigna el rol propietario", async () => {
  const respuesta = await api("/api/auth/registro").send(base).expect(201);
  assert.equal(respuesta.body.usuario.rol, "propietario");
  assert.equal(respuesta.body.usuario.activo, true);
});

test("Lab 8: ignora intentos de escalada y mass assignment", async () => {
  const ataque = {
    ...base,
    id: 9999,
    rol: "administrador",
    activo: false,
    passwordHash: "HASH_CONTROLADO",
    esSuperAdmin: true,
    permisos: ["DELETE_ALL", "ADMIN"]
  };

  const respuesta = await api("/api/auth/registro").send(ataque).expect(201);
  assert.deepEqual(respuesta.body.usuario, {
    id: 1,
    nombre: base.nombre,
    email: base.email,
    rol: "propietario",
    activo: true
  });
  assert.equal(usuarios[0].id, 1);
  assert.equal(usuarios[0].rol, "propietario");
  assert.equal(usuarios[0].activo, true);
  assert.notEqual(usuarios[0].passwordHash, "HASH_CONTROLADO");
  assert.equal(usuarios[0].esSuperAdmin, undefined);
  assert.equal(usuarios[0].permisos, undefined);
});

test("Lab 8: login continúa funcionando", async () => {
  await api("/api/auth/registro").send(base).expect(201);
  const login = await api("/api/auth/login")
    .send({ email: base.email, password: base.password })
    .expect(200);
  assert.equal(login.body.usuario.rol, "propietario");

  await api("/api/auth/login")
    .send({ email: base.email, password: "PasswordIncorrecto" })
    .expect(401);
});
