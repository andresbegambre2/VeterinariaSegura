const express = require("express");
const { crearUsuario, listarUsuarios, buscarUsuariosRecuperacion } = require("../controllers/usuarios.controller");
const { emitirTokenAdministrativo } = require("../controllers/recuperacion.controller");
const { validarCreacionUsuario, validarBusquedaRecuperacion } = require("../middlewares/usuarios.validator");
const validar = require("../middlewares/validate");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");
const { validarUsuarioObjetivo } = require("../middlewares/recuperacion.validator");

const router = express.Router();

router.get("/", autenticarJWT, autorizarRoles("administrador"), listarUsuarios);
router.get("/busqueda-recuperacion", autenticarJWT, autorizarRoles("administrador"), validarBusquedaRecuperacion, validar, buscarUsuariosRecuperacion);

router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarCreacionUsuario,
  validar,
  crearUsuario
);

router.post(
  "/:id/password-reset-token",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarUsuarioObjetivo,
  validar,
  emitirTokenAdministrativo
);

module.exports = router;
