const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const { resetStore } = require("../src/data/store");

test.beforeEach(resetStore);

test("GET / responde y no expone X-Powered-By", async () => {
  const response = await request(app).get("/").expect(200);
  assert.equal(response.body.mensaje, "API VeterinariaSegura funcionando");
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.ok(response.headers["x-content-type-options"]);
});

test("registra correctamente un propietario", async () => {
  const response = await request(app).post("/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(201);
  assert.equal(response.body.id, 2);
  assert.equal(response.body.nombre, "Mario Perez");
});

test("rechaza un propietario sin nombre", async () => {
  const response = await request(app).post("/api/propietarios").send({
    documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(400);
  assert.equal(response.body.mensaje, "Datos inválidos");
});

test("rechaza documentos duplicados", async () => {
  await request(app).post("/api/propietarios").send({
    nombre: "Otra persona", documento: "1001001", telefono: "3009876543", correo: "otra@example.com"
  }).expect(409);
});

test("registra una mascota con propietario válido", async () => {
  const response = await request(app).post("/api/mascotas").send({
    nombre: "Milo", especie: "gato", raza: "Criollo", edad: 2, propietarioId: 1
  }).expect(201);
  assert.equal(response.body.propietarioId, 1);
});

test("rechaza una mascota con propietario inexistente", async () => {
  await request(app).post("/api/mascotas").send({
    nombre: "Milo", especie: "gato", raza: "Criollo", edad: 2, propietarioId: 999
  }).expect(400, { mensaje: "El propietario indicado no existe" });
});

test("crea una cita cuando mascota y veterinario existen", async () => {
  const response = await request(app).post("/api/citas").send({
    fecha: "2026-10-02", hora: "10:30", motivo: "Vacunacion anual", estado: "programada", mascotaId: 1, veterinarioId: 1
  }).expect(201);
  assert.equal(response.body.id, 2);
});

test("rechaza una cita con veterinario inexistente", async () => {
  await request(app).post("/api/citas").send({
    fecha: "2026-10-02", hora: "10:30", motivo: "Vacunacion anual", estado: "programada", mascotaId: 1, veterinarioId: 999
  }).expect(400, { mensaje: "El veterinario indicado no existe" });
});

test("impide dos citas del veterinario en la misma fecha y hora", async () => {
  await request(app).post("/api/citas").send({
    fecha: "2026-10-01", hora: "09:00", motivo: "Otra consulta", estado: "confirmada", mascotaId: 1, veterinarioId: 1
  }).expect(409, { mensaje: "El veterinario ya tiene una cita en esa fecha y hora" });
});

test("responde 404 al consultar un ID inexistente", async () => {
  await request(app).get("/api/mascotas/999").expect(404, { mensaje: "Mascota no encontrado" });
});

test("rechaza un estado inválido", async () => {
  await request(app).patch("/api/citas/1/estado").send({ estado: "aplazada" }).expect(400);
});

test("no permite cancelar una cita atendida", async () => {
  await request(app).patch("/api/citas/1/estado").send({ estado: "atendida" }).expect(200);
  await request(app).patch("/api/citas/1/estado").send({ estado: "cancelada" }).expect(409, {
    mensaje: "Una cita atendida no puede cancelarse"
  });
});

test("consulta mascotas por propietario y citas por mascota/veterinario", async () => {
  const mascotas = await request(app).get("/api/propietarios/1/mascotas").expect(200);
  const citasMascota = await request(app).get("/api/mascotas/1/citas").expect(200);
  const citasVeterinario = await request(app).get("/api/veterinarios/1/citas").expect(200);
  assert.equal(mascotas.body.length, 1);
  assert.equal(citasMascota.body.length, 1);
  assert.equal(citasVeterinario.body.length, 1);
});

test("descarta campos no permitidos para evitar Mass Assignment", async () => {
  const response = await request(app).post("/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com", esAdmin: true
  }).expect(201);
  assert.equal(response.body.esAdmin, undefined);
});

test("publica un documento OpenAPI válido", async () => {
  const response = await request(app).get("/openapi.json").expect(200);
  assert.equal(response.body.openapi, "3.0.3");
  assert.ok(response.body.paths["/api/citas"]);
  assert.ok(response.body.paths["/api/citas/{id}/estado"]);
});

test("permite actualizar y eliminar un recurso sin relaciones", async () => {
  const created = await request(app).post("/api/propietarios").send({
    nombre: "Mario Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(201);
  const updated = await request(app).put(`/api/propietarios/${created.body.id}`).send({
    nombre: "Mario Alberto Perez", documento: "CC998877", telefono: "3009876543", correo: "mario@example.com"
  }).expect(200);
  assert.equal(updated.body.nombre, "Mario Alberto Perez");
  await request(app).delete(`/api/propietarios/${created.body.id}`).expect(200);
  await request(app).get(`/api/propietarios/${created.body.id}`).expect(404);
});
