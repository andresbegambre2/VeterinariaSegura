const { consultar } = require('../config/database');
const HttpError = require('./http-error');
// Los nombres de tablas y columnas provienen exclusivamente de configuración interna.
function createCrudService(table, fields, label, hooks = {}) {
  const columns = 'id, ' + Object.entries(fields).map(([key,col]) => `${col} AS "${key}"`).join(', ');
  const one = async (where, args) => (await consultar(`SELECT ${columns} FROM public.${table} WHERE ${where}`, args)).rows[0] ?? null;
  const service = {
    findOne: one,
    getAll: async () => (await consultar(`SELECT ${columns} FROM public.${table} ORDER BY id`)).rows,
    async getById(id) { const item = await one('id=$1',[id]); if (!item) throw new HttpError(404, `${label} no encontrado`); return item; },
    async create(data) {
      await hooks.validate?.(data);
      const entries = Object.entries(fields).filter(([key]) => Object.hasOwn(data,key));
      const result = await consultar(`INSERT INTO public.${table} (${entries.map(([,col])=>col).join(',')}) VALUES (${entries.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING ${columns}`,entries.map(([key])=>data[key]));
      return result.rows[0];
    },
    async update(id,data) {
      const previous = await service.getById(id);
      const merged = {...previous,...data};
      await hooks.validate?.(merged,id);
      const entries = Object.entries(fields).filter(([key]) => Object.hasOwn(data,key));
      if (!entries.length) throw new HttpError(400,'No hay campos permitidos para actualizar');
      const result = await consultar(`UPDATE public.${table} SET ${entries.map(([,col],i)=>`${col}=$${i+2}`).join(',')} WHERE id=$1 RETURNING ${columns}`,[id,...entries.map(([key])=>data[key])]);
      if (!result.rows[0]) throw new HttpError(404, `${label} no encontrado`);
      return result.rows[0];
    },
    async remove(id) {
      await service.getById(id);
      const result = await consultar(`DELETE FROM public.${table} WHERE id=$1 RETURNING ${columns}`,[id]);
      if (!result.rows[0]) throw new HttpError(404,`${label} no encontrado`);
      return result.rows[0];
    }
  };
  return service;
}
module.exports = createCrudService;
