const express = require("express");
const { registrar, login } = require("../controllers/auth.controller");
const { validarRegistro, validarLogin } = require("../middlewares/auth.validator");
const validate = require("../middlewares/validate");

const router = express.Router();

router.post("/registro", validarRegistro, validate, registrar);
router.post("/login", validarLogin, validate, login);

module.exports = router;
