const { body, param } = require("express-validator");

const nuevaPassword = body("nuevaPassword")
  .isString()
  .withMessage("La nueva contraseña debe ser texto")
  .isLength({ min: 12, max: 72 })
  .withMessage("La nueva contraseña debe tener entre 12 y 72 caracteres");

const validarGeneracionCodigos = [
  body("cantidad")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("La cantidad debe estar entre 1 y 10")
    .toInt()
];

const validarRecuperacionConCodigo = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),
  body("codigo")
    .isString()
    .matches(/^[A-Fa-f0-9]{4}(?:-?[A-Fa-f0-9]{4}){4}$/)
    .withMessage("El código de recuperación no tiene un formato válido"),
  nuevaPassword
];

const validarRecuperacionConToken = [
  body("token")
    .isString()
    .matches(/^[A-Za-z0-9_-]{43}$/)
    .withMessage("El token de recuperación no tiene un formato válido"),
  nuevaPassword
];

const validarUsuarioObjetivo = [
  param("id")
    .isString()
    .matches(/^[1-9][0-9]*$/)
    .withMessage("El id debe ser un entero positivo")
];

module.exports = {
  validarGeneracionCodigos,
  validarRecuperacionConCodigo,
  validarRecuperacionConToken,
  validarUsuarioObjetivo
};
