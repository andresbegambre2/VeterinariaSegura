const { body, param } = require("express-validator");

const id = [param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo")];
const text = (field, min = 2, max = 80) => body(field).isString().trim().isLength({ min, max }).escape();
const documentField = body("documento").isString().trim().matches(/^[A-Za-z0-9-]{5,20}$/);
const phone = body("telefono").isString().trim().matches(/^\+?[0-9 ]{7,15}$/);
const email = body("correo").isEmail().normalizeEmail();

const propietario = [text("nombre"), documentField, phone, email];
const mascota = [text("nombre"), text("especie"), text("raza", 1), body("edad").isFloat({ min: 0 }).toFloat(), body("propietarioId").isInt({ min: 1 }).toInt()];
const veterinario = [text("nombre"), documentField, text("especialidad"), phone, email];
const cita = [
  body("fecha").isISO8601({ strict: true }).withMessage("La fecha debe tener formato AAAA-MM-DD"),
  body("hora").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("La hora debe tener formato HH:mm"),
  text("motivo", 3, 200),
  body("estado").isIn(["programada", "confirmada", "atendida", "cancelada"]),
  body("mascotaId").isInt({ min: 1 }).toInt(),
  body("veterinarioId").isInt({ min: 1 }).toInt()
];
const estado = [body("estado").isIn(["programada", "confirmada", "atendida", "cancelada"])];

module.exports = { id, propietario, mascota, veterinario, cita, estado };
