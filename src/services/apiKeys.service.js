const apiKeys = require("../data/apiKeys");
const { generarHash, compararSeguro } = require("../utils/crypto.util");

const buscarClientePorApiKey = (apiKey) => {
  const hashRecibido = generarHash(apiKey);
  return apiKeys.find((registro) => compararSeguro(hashRecibido, registro.hash)) || null;
};

module.exports = { buscarClientePorApiKey };
