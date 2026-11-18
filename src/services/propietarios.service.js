const crud = require('./base.service');
const { consultar } = require('../config/database');
const usuarios = require('./usuarios.service');
const HttpError = require('./http-error');
const service = crud('propietarios', {"nombre": "nombre", "documento": "documento", "telefono": "telefono", "correo": "correo", "usuarioId": "usuario_id"}, 'Propietario', {
  async validate(data) {
    if (data.usuarioId != null) {
      const user = await usuarios.obtenerUsuarioPorId(data.usuarioId);
      if (!user) throw new HttpError(400,'El usuario indicado no existe');
      if (user.rol !== 'propietario' || !user.activo) throw new HttpError(409,'El usuario debe estar activo y tener rol propietario');
    }
  }
});
service.getByUsuarioId = id => service.findOne('usuario_id=$1',[id]);
service.getMascotas = async id => { await service.getById(id); return (await consultar('SELECT id,nombre,especie,raza,edad,propietario_id AS "propietarioId" FROM public.mascotas WHERE propietario_id=$1 ORDER BY id',[id])).rows; };
module.exports = service;
