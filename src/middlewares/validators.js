const { body, param } = require("express-validator");

const esId = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return false;
  const text = String(value);
  return /^[1-9][0-9]*$/.test(text) && BigInt(text) <= 9223372036854775807n;
};
const id = [param("id").custom(esId).withMessage("El id debe ser un entero positivo")];
const text = (field, min = 2, max = 80) => body(field).isString().trim().isLength({ min, max }).escape();
const documentField = body("documento").isString().trim().matches(/^[A-Za-z0-9-]{5,20}$/);
const phone = body("telefono").isString().trim().matches(/^\+?[0-9 ]{7,15}$/);
const email = body("correo").isEmail().normalizeEmail();

const usuarioId = body("usuarioId").optional({ nullable: true }).custom(esId);
const propietario = [text("nombre"), documentField, phone, email, usuarioId];
const mascota = [text("nombre"), text("especie"), text("raza", 1), body("edad").isFloat({ min: 0 }).toFloat(), body("propietarioId").custom(esId)];
const veterinario = [text("nombre"), documentField, text("especialidad"), phone, email, usuarioId];
const cita = [
  body("fecha").isISO8601({ strict: true }).withMessage("La fecha debe tener formato AAAA-MM-DD"),
  body("hora").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("La hora debe tener formato HH:mm"),
  text("motivo", 3, 200),
  body("estado").optional().isIn(["programada", "confirmada", "atendida", "cancelada"]),
  body("mascotaId").custom(esId),
  body("veterinarioId").custom(esId)
];
const estado = [body("estado").isIn(["programada", "confirmada", "atendida", "cancelada"])];

module.exports = { id, propietario, mascota, veterinario, cita, estado };

module.exports.esId = esId;
