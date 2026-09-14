const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");

const service = createCrudService(store.propietarios, "Propietario", {
  validate(data, currentId) {
    if (store.propietarios.some((p) => p.documento === data.documento && p.id !== currentId)) {
      throw new HttpError(409, "Ya existe un propietario con ese documento");
    }
    if (store.propietarios.some((p) => p.correo.toLowerCase() === data.correo.toLowerCase() && p.id !== currentId)) {
      throw new HttpError(409, "Ya existe un propietario con ese correo");
    }
  },
  beforeRemove(id) {
    if (store.mascotas.some((m) => m.propietarioId === id)) {
      throw new HttpError(409, "No se puede eliminar un propietario que tiene mascotas");
    }
  }
});

service.getMascotas = (id) => {
  service.getById(id);
  return store.mascotas.filter((m) => m.propietarioId === Number(id));
};

module.exports = service;
