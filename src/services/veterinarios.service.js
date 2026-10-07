const { store } = require("../data/store");
const createCrudService = require("./base.service");
const HttpError = require("./http-error");
const usuariosService = require("./usuarios.service");

const service = createCrudService(store.veterinarios, "Veterinario", {
  validate(data, currentId) {
    if (store.veterinarios.some((v) => v.documento === data.documento && v.id !== currentId)) {
      throw new HttpError(409, "Ya existe un veterinario con ese documento");
    }
    if (store.veterinarios.some((v) => v.correo.toLowerCase() === data.correo.toLowerCase() && v.id !== currentId)) {
      throw new HttpError(409, "Ya existe un veterinario con ese correo");
    }
    if (data.usuarioId != null) {
      const usuario = usuariosService.obtenerUsuarioPorId(data.usuarioId);
      if (!usuario) throw new HttpError(400, "El usuario indicado no existe");
      if (usuario.rol !== "veterinario") throw new HttpError(409, "El usuario debe tener rol veterinario");
      if (store.veterinarios.some((v) => v.usuarioId === data.usuarioId && v.id !== currentId)) {
        throw new HttpError(409, "El usuario ya está asociado a otro veterinario");
      }
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

service.getByUsuarioId = (usuarioId) =>
  store.veterinarios.find((veterinario) => veterinario.usuarioId === Number(usuarioId));

module.exports = service;
