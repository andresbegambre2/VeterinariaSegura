const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");

const service = createCrudService(store.veterinarios, "Veterinario", {
  validate(data, currentId) {
    if (store.veterinarios.some((v) => v.documento === data.documento && v.id !== currentId)) {
      throw new HttpError(409, "Ya existe un veterinario con ese documento");
    }
    if (store.veterinarios.some((v) => v.correo.toLowerCase() === data.correo.toLowerCase() && v.id !== currentId)) {
      throw new HttpError(409, "Ya existe un veterinario con ese correo");
    }
  },
  beforeRemove(id) {
    if (store.citas.some((c) => c.veterinarioId === id)) {
      throw new HttpError(409, "No se puede eliminar un veterinario que tiene citas");
    }
  }
});

service.getCitas = (id) => {
  service.getById(id);
  return store.citas.filter((c) => c.veterinarioId === Number(id));
};

module.exports = service;
