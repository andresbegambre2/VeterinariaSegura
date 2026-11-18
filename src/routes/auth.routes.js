const express = require("express");
const { registrar, login, cambiarPassword } = require("../controllers/auth.controller");
const {
  generarCodigos,
  restablecerConCodigo,
  restablecerConToken
} = require("../controllers/recuperacion.controller");
const { validarRegistro, validarLogin, validarCambioPassword } = require("../middlewares/auth.validator");
const validate = require("../middlewares/validate");
const autenticarJWT = require("../middlewares/auth.middleware");
const {
  validarGeneracionCodigos,
  validarRecuperacionConCodigo,
  validarRecuperacionConToken
} = require("../middlewares/recuperacion.validator");

const router = express.Router();

router.post("/registro", validarRegistro, validate, registrar);
router.post("/login", validarLogin, validate, login);
router.patch("/cambiar-password", autenticarJWT, validarCambioPassword, validate, cambiarPassword);
router.post(
  "/codigos-recuperacion",
  autenticarJWT,
  validarGeneracionCodigos,
  validate,
  generarCodigos
);
router.post(
  "/recuperar-con-codigo",
  validarRecuperacionConCodigo,
  validate,
  restablecerConCodigo
);
router.post(
  "/restablecer-password",
  validarRecuperacionConToken,
  validate,
  restablecerConToken
);
router.get("/perfil", autenticarJWT, (req, res) => res.status(200).json({
  mensaje: "Usuario autenticado mediante JWT",
  usuario: req.usuario,
  clienteApi: req.clienteApi
}));

module.exports = router;
