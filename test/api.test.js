const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const { resetStore } = require("../src/data/store");

const API_KEY_POSTMAN = process.env.API_KEY_POSTMAN;
const API_KEY_ADMIN = process.env.API_KEY_ADMIN;
const API_KEY_MOVIL = process.env.API_KEY_MOVIL;
const api = (method, path, clave = API_KEY_POSTMAN) => request(app)[method](path).set("X-API-Key", clave);

test.beforeEach(resetStore);

test("GET / responde y no expone X-Powered-By", async () => {
  const response = await request(app).get("/").expect(200);
  assert.equal(response.body.mensaje, "API VeterinariaSegura funcionando");
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.ok(response.headers["x-content-type-options"]);
});

test("registra correctamente un propietario", async () => {
  const response = await api("post", "/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(201);
  assert.equal(response.body.id, 2);
  assert.equal(response.body.nombre, "Mario Perez");
});

test("rechaza un propietario sin nombre", async () => {
  const response = await api("post", "/api/propietarios").send({
    documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(400);
  assert.equal(response.body.mensaje, "Datos inválidos");
});

test("rechaza documentos duplicados", async () => {
  await api("post", "/api/propietarios").send({
    nombre: "Otra persona", documento: "1001001", telefono: "3009876543", correo: "otra@example.com"
  }).expect(409);
});

test("registra una mascota con propietario válido", async () => {
  const response = await api("post", "/api/mascotas").send({
    nombre: "Milo", especie: "gato", raza: "Criollo", edad: 2, propietarioId: 1
  }).expect(201);
  assert.equal(response.body.propietarioId, 1);
});

test("rechaza una mascota con propietario inexistente", async () => {
  await api("post", "/api/mascotas").send({
    nombre: "Milo", especie: "gato", raza: "Criollo", edad: 2, propietarioId: 999
  }).expect(400, { mensaje: "El propietario indicado no existe" });
});

test("crea una cita cuando mascota y veterinario existen", async () => {
  const response = await api("post", "/api/citas").send({
    fecha: "2026-10-02", hora: "10:30", motivo: "Vacunacion anual", estado: "programada", mascotaId: 1, veterinarioId: 1
  }).expect(201);
  assert.equal(response.body.id, 2);
});

test("rechaza una cita con veterinario inexistente", async () => {
  await api("post", "/api/citas").send({
    fecha: "2026-10-02", hora: "10:30", motivo: "Vacunacion anual", estado: "programada", mascotaId: 1, veterinarioId: 999
  }).expect(400, { mensaje: "El veterinario indicado no existe" });
});

test("impide dos citas del veterinario en la misma fecha y hora", async () => {
  await api("post", "/api/citas").send({
    fecha: "2026-10-01", hora: "09:00", motivo: "Otra consulta", estado: "confirmada", mascotaId: 1, veterinarioId: 1
  }).expect(409, { mensaje: "El veterinario ya tiene una cita en esa fecha y hora" });
});

test("responde 404 al consultar un ID inexistente", async () => {
  await api("get", "/api/mascotas/999").expect(404, { mensaje: "Mascota no encontrado" });
});

test("rechaza un estado inválido", async () => {
  await api("patch", "/api/citas/1/estado").send({ estado: "aplazada" }).expect(400);
});

test("aplica la máquina de estados de las citas", async () => {
  await api("patch", "/api/citas/1/estado").send({ estado: "atendida" }).expect(409, {
    mensaje: "No se permite cambiar una cita de programada a atendida"
  });
  await api("patch", "/api/citas/1/estado").send({ estado: "confirmada" }).expect(200);
  await api("patch", "/api/citas/1/estado").send({ estado: "atendida" }).expect(200);
  await api("patch", "/api/citas/1/estado").send({ estado: "programada" }).expect(409, {
    mensaje: "No se permite cambiar una cita de atendida a programada"
  });
});

test("consulta mascotas por propietario y citas por mascota/veterinario", async () => {
  const mascotas = await api("get", "/api/propietarios/1/mascotas").expect(200);
  const citasMascota = await api("get", "/api/mascotas/1/citas").expect(200);
  const citasVeterinario = await api("get", "/api/veterinarios/1/citas").expect(200);
  assert.equal(mascotas.body.length, 1);
  assert.equal(citasMascota.body.length, 1);
  assert.equal(citasVeterinario.body.length, 1);
});

test("descarta campos no permitidos para evitar Mass Assignment", async () => {
  const response = await api("post", "/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com", esAdmin: true
  }).expect(201);
  assert.equal(response.body.esAdmin, undefined);
});

test("publica un documento OpenAPI válido", async () => {
  const response = await request(app).get("/openapi.json").expect(200);
  assert.equal(response.body.openapi, "3.0.3");
  assert.ok(response.body.paths["/api/citas"]);
  assert.ok(response.body.paths["/api/citas/{id}/estado"]);
  assert.ok(response.body.paths["/api/seguridad/cliente"]);
});

test("permite actualizar y eliminar un recurso sin relaciones", async () => {
  const created = await api("post", "/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(201);
  const updated = await api("put", `/api/propietarios/${created.body.id}`).send({
    nombre: "Mario Alberto Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(200);
  assert.equal(updated.body.nombre, "Mario Alberto Perez");
  await api("delete", `/api/propietarios/${created.body.id}`).expect(200);
  await api("get", `/api/propietarios/${created.body.id}`).expect(404);
});

test("protege /api con API Key", async () => {
  await request(app).get("/api/mascotas").expect(401, { mensaje: "API Key requerida" });
  await request(app).get("/api/mascotas").set("X-API-Key", "incorrecta").expect(401, { mensaje: "API Key inválida" });
  await request(app).get(`/api/mascotas?apiKey=${API_KEY_POSTMAN}`).expect(401, { mensaje: "API Key requerida" });
  await api("get", "/api/mascotas").expect(200);
  await api("get", "/api/mascotas", API_KEY_ADMIN).expect(200);
  await api("get", "/api/mascotas", API_KEY_MOVIL).expect(403, { mensaje: "API Key deshabilitada" });
});

test("identifica al cliente autenticado sin exponer su API Key", async () => {
  const postman = await api("get", "/api/seguridad/cliente").expect(200);
  assert.deepEqual(postman.body, {
    mensaje: "Cliente autenticado",
    cliente: { id: 1, nombre: "Postman Laboratorio" }
  });

  const admin = await api("get", "/api/seguridad/cliente", API_KEY_ADMIN).expect(200);
  assert.deepEqual(admin.body.cliente, { id: 2, nombre: "Aplicación Administrativa" });
  assert.equal(JSON.stringify(admin.body).includes(API_KEY_ADMIN), false);
});

test("conserva la integridad referencial al eliminar", async () => {
  await api("delete", "/api/propietarios/1").expect(409);
  await api("delete", "/api/mascotas/1").expect(409);
  await api("delete", "/api/veterinarios/1").expect(409);
  await api("delete", "/api/mascotas/abc").expect(400);
});
