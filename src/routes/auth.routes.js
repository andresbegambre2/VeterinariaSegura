const express = require("express");
const { registrar, login } = require("../controllers/auth.controller");
const { validarRegistro, validarLogin } = require("../middlewares/auth.validator");
const validate = require("../middlewares/validate");
const autenticarJWT = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/registro", validarRegistro, validate, registrar);
router.post("/login", validarLogin, validate, login);
router.get("/perfil", autenticarJWT, (req, res) => res.status(200).json({
  mensaje: "Usuario autenticado mediante JWT",
  usuario: req.usuario,
  clienteApi: req.clienteApi
}));

module.exports = router;
