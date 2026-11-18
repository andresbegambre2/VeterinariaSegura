const crud = require('./base.service');
const { consultar } = require('../config/database');
const service = crud('mascotas',{nombre:'nombre',especie:'especie',raza:'raza',edad:'edad',propietarioId:'propietario_id'},'Mascota');
service.getCitas = async id => {
  await service.getById(id);
  return (await consultar(`SELECT id, TO_CHAR(fecha,'YYYY-MM-DD') AS fecha, TO_CHAR(hora,'HH24:MI') AS hora, motivo,estado,mascota_id AS "mascotaId",veterinario_id AS "veterinarioId" FROM public.citas WHERE mascota_id=$1 ORDER BY fecha,hora`,[id])).rows;
};
module.exports = service;
