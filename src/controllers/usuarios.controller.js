const { matchedData } = require("express-validator");
const usuariosService = require("../services/usuarios.service");

async function listarUsuarios(req, res, next) {
  try {
    return res.status(200).json(await usuariosService.listarUsuarios());
  } catch (error) {
    return next(error);
  }
}

async function buscarUsuariosRecuperacion(req, res, next) {
  try {
    const texto = String(req.query.q || "").trim();
    return res.status(200).json({ usuarios: await usuariosService.buscarUsuariosRecuperacion(texto) });
  } catch (error) {
    return next(error);
  }
}

async function crearUsuario(req, res, next) {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    if (await usuariosService.obtenerUsuarioPorEmail(datos.email)) {
      return res.status(409).json({ mensaje: "Ya existe un usuario con ese correo electrónico" });
    }
    const usuario = await usuariosService.crearUsuarioAdministrativo(datos);
    const { id, nombre, email, rol, activo } = usuario;
    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: { id, nombre, email, rol, activo }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { crearUsuario, listarUsuarios, buscarUsuariosRecuperacion };
