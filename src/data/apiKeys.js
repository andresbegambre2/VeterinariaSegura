const { generarHash } = require("../utils/crypto.util");

const configuracion = [
  ["Postman Laboratorio", process.env.API_KEY_POSTMAN, true],
  ["Aplicación Administrativa", process.env.API_KEY_ADMIN, true],
  ["Aplicación Móvil", process.env.API_KEY_MOVIL, false]
];

if (configuracion.some(([, clave]) => !clave)) {
  throw new Error("Faltan variables de entorno para las API Keys");
}

module.exports = configuracion.map(([cliente, clave, activa], indice) => ({
  id: indice + 1,
  cliente,
  hash: generarHash(clave),
  activa,
  creadaEn: "2026-09-21"
}));
