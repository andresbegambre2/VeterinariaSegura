const express = require("express");
const { crearUsuario } = require("../controllers/usuarios.controller");
const { validarCreacionUsuario } = require("../middlewares/usuarios.validator");
const validar = require("../middlewares/validate");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

const router = express.Router();

router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarCreacionUsuario,
  validar,
  crearUsuario
);

module.exports = router;
