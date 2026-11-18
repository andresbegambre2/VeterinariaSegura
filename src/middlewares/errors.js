function sqlStatus(error) {
  if (error.code === '23505') return [409,'El registro ya existe o el horario está ocupado'];
  if (error.code === '23503') return [409,'La operación entra en conflicto con un registro relacionado'];
  if (['23502','23514','22P02','22007','22008'].includes(error.code)) return [400,'Datos no válidos para la operación'];
  if (error.codigoAplicacion === 'ROL_INVALIDO') return [400,'Rol no permitido'];
  return [error.status || 500, error.status ? error.message : 'Error interno del servidor'];
}
function errorHandler(error,req,res,next) {
  if (res.headersSent) return next(error);
  const [status,mensaje] = sqlStatus(error);
  return res.status(status).json({mensaje});
}
function notFound(req,res) { return res.status(404).json({mensaje:'Ruta no encontrada'}); }

module.exports={errorHandler,notFound};
