const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");
const usuariosService = require("./usuarios.service");

const service = createCrudService(store.propietarios, "Propietario", {
  validate(data, currentId) {
    if (store.propietarios.some((p) => p.documento === data.documento && p.id !== currentId)) {
      throw new HttpError(409, "Ya existe un propietario con ese documento");
    }
    if (store.propietarios.some((p) => p.correo.toLowerCase() === data.correo.toLowerCase() && p.id !== currentId)) {
      throw new HttpError(409, "Ya existe un propietario con ese correo");
    }
    if (data.usuarioId != null) {
      const usuario = usuariosService.obtenerUsuarioPorId(data.usuarioId);
      if (!usuario) throw new HttpError(400, "El usuario indicado no existe");
      if (usuario.rol !== "propietario") throw new HttpError(409, "El usuario debe tener rol propietario");
      if (store.propietarios.some((p) => p.usuarioId === data.usuarioId && p.id !== currentId)) {
        throw new HttpError(409, "El usuario ya está asociado a otro propietario");
      }
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

service.getByUsuarioId = (usuarioId) =>
  store.propietarios.find((propietario) => propietario.usuarioId === Number(usuarioId));

module.exports = service;
