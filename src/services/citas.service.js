const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");

const estados = ["programada", "confirmada", "atendida", "cancelada"];

function validate(data, currentId) {
  if (!store.mascotas.some((m) => m.id === data.mascotaId)) throw new HttpError(400, "La mascota indicada no existe");
  if (!store.veterinarios.some((v) => v.id === data.veterinarioId)) throw new HttpError(400, "El veterinario indicado no existe");
  if (store.citas.some((c) => c.veterinarioId === data.veterinarioId && c.fecha === data.fecha && c.hora === data.hora && c.id !== currentId && c.estado !== "cancelada")) {
    throw new HttpError(409, "El veterinario ya tiene una cita en esa fecha y hora");
  }
}

const service = createCrudService(store.citas, "Cita", { validate });

service.updateEstado = (id, estado) => {
  const cita = service.getById(id);
  if (cita.estado === "atendida" && estado === "cancelada") throw new HttpError(409, "Una cita atendida no puede cancelarse");
  if (!estados.includes(estado)) throw new HttpError(400, "Estado de cita no permitido");
  cita.estado = estado;
  return cita;
};

module.exports = service;
