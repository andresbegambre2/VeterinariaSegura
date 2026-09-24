const { buscarClientePorApiKey } = require("../services/apiKeys.service");

function validarApiKey(req, res, next) {
  const apiKeyRecibida = req.get("X-API-Key");
  if (!apiKeyRecibida) return res.status(401).json({ mensaje: "API Key requerida" });

  const cliente = buscarClientePorApiKey(apiKeyRecibida);

  if (!cliente) {
    return res.status(401).json({ mensaje: "API Key inválida" });
  }

  if (!cliente.activa) {
    return res.status(403).json({ mensaje: "API Key deshabilitada" });
  }

  req.clienteApi = { id: cliente.id, nombre: cliente.cliente };

  next();
}

module.exports = validarApiKey;
