const { body, checkExact } = require("express-validator");

const validarRegistro = [
  body("nombre").isString().withMessage("El nombre debe ser texto").trim()
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres"),
  body("email").isEmail().withMessage("Debe proporcionar un correo electrónico válido").normalizeEmail(),
  body("password").isString().withMessage("La contraseña debe ser texto")
    .isLength({ min: 10, max: 72 }).withMessage("La contraseña debe tener entre 10 y 72 caracteres")
];

const validarLogin = [
  body("email").isEmail().withMessage("Debe proporcionar un correo electrónico válido").normalizeEmail(),
  body("password").isString().withMessage("La contraseña debe ser texto").notEmpty()
    .withMessage("La contraseña es obligatoria"),
  checkExact([], { message: "El cuerpo contiene campos no permitidos" })
];

const validarCambioPassword = [
  body("passwordActual").isString().notEmpty().withMessage("La contraseña actual es obligatoria"),
  body("passwordNueva").isString().isLength({ min: 12, max: 72 })
    .withMessage("La nueva contraseña debe tener entre 12 y 72 caracteres")
    .matches(/[a-z]/).withMessage("Incluya una minúscula")
    .matches(/[A-Z]/).withMessage("Incluya una mayúscula")
    .matches(/[0-9]/).withMessage("Incluya un número"),
  body("confirmarPassword").custom((value, { req }) => value === req.body.passwordNueva)
    .withMessage("La confirmación no coincide"),
  checkExact([], { message: "El cuerpo contiene campos no permitidos" })
];

module.exports = { validarRegistro, validarLogin, validarCambioPassword };
