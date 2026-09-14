function notFound(req, res) {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  res.status(status).json({ mensaje: status === 500 ? "Error interno del servidor" : error.message });
}

module.exports = { notFound, errorHandler };
