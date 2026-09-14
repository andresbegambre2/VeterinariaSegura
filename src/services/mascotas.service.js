const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");

const service = createCrudService(store.mascotas, "Mascota", {
  validate(data) {
    if (!store.propietarios.some((p) => p.id === data.propietarioId)) {
      throw new HttpError(400, "El propietario indicado no existe");
    }
  },
  beforeRemove(id) {
    if (store.citas.some((c) => c.mascotaId === id)) {
      throw new HttpError(409, "No se puede eliminar una mascota que tiene citas");
    }
  }
});

service.getCitas = (id) => {
  service.getById(id);
  return store.citas.filter((c) => c.mascotaId === Number(id));
};

module.exports = service;
