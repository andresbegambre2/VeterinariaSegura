const crypto = require("crypto");

function compararSeguro(valorRecibido, valorEsperado) {
  const recibido = Buffer.from(valorRecibido);
  const esperado = Buffer.from(valorEsperado);

  if (recibido.length !== esperado.length) return false;
  return crypto.timingSafeEqual(recibido, esperado);
}

function validarApiKey(req, res, next) {
  const apiKeyConfigurada = process.env.API_KEY;

  if (!apiKeyConfigurada) {
    console.error("ERROR: La variable de entorno API_KEY no está configurada.");
    return res.status(500).json({ mensaje: "Error de configuración del servidor" });
  }

  const apiKeyRecibida = req.get("X-API-Key");
  if (!apiKeyRecibida) return res.status(401).json({ mensaje: "API Key requerida" });

  if (!compararSeguro(apiKeyRecibida, apiKeyConfigurada)) {
    return res.status(401).json({ mensaje: "API Key inválida" });
  }

  next();
}

module.exports = validarApiKey;
