const crud = require('./base.service');
const { consultar } = require('../config/database');
const usuarios = require('./usuarios.service');
const HttpError = require('./http-error');
const service = crud('veterinarios', {"nombre": "nombre", "documento": "documento", "telefono": "telefono", "correo": "correo", "usuarioId": "usuario_id", "especialidad": "especialidad"}, 'Veterinario', {
  async validate(data) {
    if (data.usuarioId != null) {
      const user = await usuarios.obtenerUsuarioPorId(data.usuarioId);
      if (!user) throw new HttpError(400,'El usuario indicado no existe');
      if (user.rol !== 'veterinario' || !user.activo) throw new HttpError(409,'El usuario debe estar activo y tener rol veterinario');
    }
  }
});
service.getByUsuarioId = id => service.findOne('usuario_id=$1',[id]);
service.getCitas = async id => { await service.getById(id); return require('./citas.service').getByVeterinarioId(id); };
module.exports = service;
