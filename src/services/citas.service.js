const { consultar } = require('../config/database');
const HttpError = require('./http-error');
const columns = `id,TO_CHAR(fecha,'YYYY-MM-DD') AS fecha,TO_CHAR(hora,'HH24:MI') AS hora,motivo,estado,mascota_id AS "mascotaId",veterinario_id AS "veterinarioId"`;
const select = async (where='', args=[]) => (await consultar(`SELECT ${columns} FROM public.citas ${where} ORDER BY fecha,hora,id`,args)).rows;
const service = {
  getAll: () => select(),
  async getById(id) { const item=(await select('WHERE id=$1',[id]))[0]; if (!item) throw new HttpError(404,'Cita no encontrada'); return item; },
  async create(data) {
    if (data.estado && data.estado !== 'programada') throw new HttpError(409,'Una cita nueva debe estar programada');
    return (await consultar(`INSERT INTO public.citas (fecha,hora,motivo,mascota_id,veterinario_id) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`,[data.fecha,data.hora,data.motivo,data.mascotaId,data.veterinarioId])).rows[0];
  },
  async update(id,data) {
    const result=await consultar(`UPDATE public.citas SET fecha=$2,hora=$3,motivo=$4,mascota_id=$5,veterinario_id=$6 WHERE id=$1 AND ($7::text IS NULL OR estado=$7) RETURNING ${columns}`,[id,data.fecha,data.hora,data.motivo,data.mascotaId,data.veterinarioId,data.estado ?? null]);
    if (!result.rows[0]) { await service.getById(id); throw new HttpError(409,'Cambie el estado mediante PATCH /citas/:id/estado'); }
    return result.rows[0];
  },
  async updateEstado(id,estado) {
    const result=await consultar(`UPDATE public.citas SET estado=$2 WHERE id=$1 AND ((estado='programada' AND $2 IN ('confirmada','cancelada')) OR (estado='confirmada' AND $2 IN ('atendida','cancelada'))) RETURNING ${columns}`,[id,estado]);
    if (!result.rows[0]) { await service.getById(id); throw new HttpError(409,'Transición de estado no permitida'); }
    return result.rows[0];
  },
  async remove(id) { const result=await consultar(`DELETE FROM public.citas WHERE id=$1 RETURNING ${columns}`,[id]); if (!result.rows[0]) throw new HttpError(404,'Cita no encontrada'); return result.rows[0]; },
  getByVeterinarioId: id => select('WHERE veterinario_id=$1',[id]),
  getByPropietarioId: id => select('WHERE mascota_id IN (SELECT id FROM public.mascotas WHERE propietario_id=$1)',[id]),
  async cambiarEstadoPropio({ citaId, usuarioId, rol, estado }) {
    const esPropietario = rol === 'propietario';
    const filtroPropio = esPropietario
      ? `EXISTS (SELECT 1 FROM public.mascotas m JOIN public.propietarios p ON p.id=m.propietario_id WHERE m.id=c.mascota_id AND p.usuario_id=$2)`
      : `EXISTS (SELECT 1 FROM public.veterinarios v WHERE v.id=c.veterinario_id AND v.usuario_id=$2)`;
    const estadosOrigen = esPropietario
      ? ['programada','confirmada']
      : estado === 'confirmada' ? ['programada'] : ['confirmada'];
    const result = await consultar(`UPDATE public.citas c SET estado=$3 WHERE c.id=$1 AND c.estado=ANY($4::text[]) AND ${filtroPropio} RETURNING ${columns}`,[citaId,usuarioId,estado,estadosOrigen]);
    return result.rows[0] ?? null;
  }
};
module.exports = service;
