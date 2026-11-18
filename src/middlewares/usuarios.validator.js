const { body, query } = require("express-validator");

const validarCreacionUsuario = [
  body("nombre").isString().trim().isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres"),
  body("email").isEmail().normalizeEmail()
    .withMessage("Debe proporcionar un correo electrónico válido"),
  body("password").isString().isLength({ min: 10, max: 72 })
    .withMessage("La contraseña debe tener entre 10 y 72 caracteres"),
  body("rol").isIn(["veterinario", "administrador"])
    .withMessage("El rol debe ser veterinario o administrador")
];

const validarBusquedaRecuperacion = [
  query("q").isString().trim().isLength({ min: 2, max: 100 })
    .withMessage("La búsqueda debe tener entre 2 y 100 caracteres")
];

module.exports = { validarCreacionUsuario, validarBusquedaRecuperacion };
