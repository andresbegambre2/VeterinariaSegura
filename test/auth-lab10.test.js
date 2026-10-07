const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET ||= "secreto-de-pruebas-lab10-veterinaria";
process.env.JWT_EXPIRES_IN ||= "1h";

const app = require("../src/app");
const { resetStore, store } = require("../src/data/store");
const { resetUsuarios } = require("../src/data/usuarios");
const usuariosService = require("../src/services/usuarios.service");
const { generarToken } = require("../src/utils/jwt.util");

const API_KEY = process.env.API_KEY_POSTMAN;
const api = (method, path, token) => {
  const solicitud = request(app)[method](path).set("X-API-Key", API_KEY);
  return token ? solicitud.set("Authorization", `Bearer ${token}`) : solicitud;
};

async function usuario(datos) {
  if (datos.rol === "propietario") return usuariosService.crearUsuario(datos);
  return usuariosService.crearUsuarioAdministrativo(datos);
}

async function prepararEscenario() {
  const propietarioA = await usuario({ nombre: "Propietario A", email: "a@lab10.com", password: "ClaveSeguraA1!", rol: "propietario" });
  const propietarioB = await usuario({ nombre: "Propietario B", email: "b@lab10.com", password: "ClaveSeguraB1!", rol: "propietario" });
  const veterinarioA = await usuario({ nombre: "Veterinario A", email: "vet-a@lab10.com", password: "ClaveSeguraV1!", rol: "veterinario" });
  const veterinarioB = await usuario({ nombre: "Veterinario B", email: "vet-b@lab10.com", password: "ClaveSeguraV2!", rol: "veterinario" });
  const admin = await usuario({ nombre: "Administrador", email: "admin@lab10.com", password: "ClaveSeguraAdmin1!", rol: "administrador" });

  store.propietarios[0].usuarioId = propietarioA.id;
  store.propietarios.push({ id: 2, nombre: "Propietario B", documento: "1001002", telefono: "3000000002", correo: "b@perfil.com", usuarioId: propietarioB.id });
  store.mascotas.push({ id: 2, nombre: "Sol", especie: "gato", raza: "Criollo", edad: 2, propietarioId: 2 });
  store.veterinarios[0].usuarioId = veterinarioA.id;
  store.veterinarios.push({ id: 2, nombre: "Veterinario B", documento: "2002003", especialidad: "Cirugía", telefono: "3010000002", correo: "vetb@perfil.com", usuarioId: veterinarioB.id });
  store.citas.push({ id: 2, fecha: "2026-10-02", hora: "11:00", motivo: "Consulta felina", estado: "programada", mascotaId: 2, veterinarioId: 2 });

  return {
    propietarioA: generarToken(propietarioA),
    propietarioB: generarToken(propietarioB),
    veterinarioA: generarToken(veterinarioA),
    veterinarioB: generarToken(veterinarioB),
    admin: generarToken(admin)
  };
}

test.beforeEach(() => {
  resetStore();
  resetUsuarios();
});

test("Lab 10: distingue autenticación 401 de autorización 403", async () => {
  const tokens = await prepararEscenario();
  await api("get", "/api/citas").expect(401);
  await api("get", "/api/citas", "token-invalido").expect(401);
  await api("get", "/api/citas", tokens.propietarioA).expect(403);
  await api("get", "/api/citas", tokens.admin).expect(200);
});

test("Lab 10: solo el administrador crea usuarios privilegiados y evita mass assignment", async () => {
  const tokens = await prepararEscenario();
  const payload = {
    nombre: "Veterinaria Nueva",
    email: "nueva@lab10.com",
    password: "ClaveSeguraNueva1!",
    rol: "veterinario",
    activo: false,
    passwordHash: "inyectado",
    id: 999
  };
  await api("post", "/api/usuarios", tokens.veterinarioA).send(payload).expect(403);
  const respuesta = await api("post", "/api/usuarios", tokens.admin).send(payload).expect(201);
  assert.equal(respuesta.body.usuario.rol, "veterinario");
  assert.equal(respuesta.body.usuario.activo, true);
  assert.notEqual(respuesta.body.usuario.id, 999);
  assert.equal(respuesta.body.usuario.passwordHash, undefined);
});

test("Lab 10: el registro público no permite escalar privilegios", async () => {
  const respuesta = await api("post", "/api/auth/registro").send({
    nombre: "Usuario Público",
    email: "publico@lab10.com",
    password: "ClaveSeguraPublica1!",
    rol: "administrador",
    activo: false
  }).expect(201);
  assert.equal(respuesta.body.usuario.rol, "propietario");
  assert.equal(respuesta.body.usuario.activo, true);
});

test("Lab 10: valida existencia, rol y unicidad al asociar perfiles", async () => {
  const tokens = await prepararEscenario();
  await api("post", "/api/propietarios", tokens.admin).send({
    nombre: "Perfil Inválido", documento: "3003003", telefono: "3000000003", correo: "invalido@perfil.com", usuarioId: 999
  }).expect(400);
  const vetUsuario = await usuario({ nombre: "Veterinario C", email: "vet-c@lab10.com", password: "ClaveSeguraV3!", rol: "veterinario" });
  await api("post", "/api/propietarios", tokens.admin).send({
    nombre: "Perfil Rol Malo", documento: "3003004", telefono: "3000000004", correo: "rol@perfil.com", usuarioId: vetUsuario.id
  }).expect(409);
  const propietario = await usuario({ nombre: "Propietario C", email: "c@lab10.com", password: "ClaveSeguraC1!", rol: "propietario" });
  await api("post", "/api/propietarios", tokens.admin).send({
    nombre: "Perfil C", documento: "3003005", telefono: "3000000005", correo: "c@perfil.com", usuarioId: propietario.id
  }).expect(201);
  await api("post", "/api/propietarios", tokens.admin).send({
    nombre: "Perfil D", documento: "3003006", telefono: "3000000006", correo: "d@perfil.com", usuarioId: propietario.id
  }).expect(409);
});

test("Lab 10: bloquea IDOR entre propietarios y permite las citas propias", async () => {
  const tokens = await prepararEscenario();
  const propias = await api("get", "/api/citas/propietario/1", tokens.propietarioA).expect(200);
  assert.deepEqual(propias.body.map(({ id }) => id), [1]);
  await api("get", "/api/citas/propietario/1", tokens.propietarioB).expect(403);
  await api("get", "/api/citas/1", tokens.propietarioA).expect(200);
  await api("get", "/api/citas/1", tokens.propietarioB).expect(403);
  const mias = await api("get", "/api/citas/mis-citas", tokens.propietarioA).expect(200);
  assert.deepEqual(mias.body.map(({ id }) => id), [1]);
});

test("Lab 10: bloquea IDOR entre veterinarios y permite las citas asignadas", async () => {
  const tokens = await prepararEscenario();
  await api("get", "/api/citas/veterinario/1", tokens.veterinarioA).expect(200);
  await api("get", "/api/citas/veterinario/1", tokens.veterinarioB).expect(403);
  await api("get", "/api/citas/1", tokens.veterinarioA).expect(200);
  await api("get", "/api/citas/1", tokens.veterinarioB).expect(403);
  const mias = await api("get", "/api/citas/mis-citas", tokens.veterinarioA).expect(200);
  assert.deepEqual(mias.body.map(({ id }) => id), [1]);
});

test("Lab 10: las escrituras de citas son exclusivas del administrador", async () => {
  const tokens = await prepararEscenario();
  const payload = { fecha: "2026-11-01", hora: "13:00", motivo: "Control preventivo", estado: "programada", mascotaId: 1, veterinarioId: 1 };
  await api("post", "/api/citas", tokens.propietarioA).send(payload).expect(403);
  await api("post", "/api/citas", tokens.veterinarioA).send(payload).expect(403);
  await api("post", "/api/citas", tokens.admin).send(payload).expect(201);
});

test("Lab 10: Swagger declara API Key y Bearer en las rutas protegidas", async () => {
  const spec = (await request(app).get("/openapi.json").expect(200)).body;
  assert.deepEqual(spec.paths["/api/citas"].get.security, [{ ApiKeyAuth: [], BearerAuth: [] }]);
  assert.deepEqual(spec.paths["/api/usuarios"].post.security, [{ ApiKeyAuth: [], BearerAuth: [] }]);
  assert.ok(spec.paths["/api/citas/mis-citas"]);
});
