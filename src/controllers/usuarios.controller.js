const { matchedData } = require("express-validator");
const usuariosService = require("../services/usuarios.service");

async function crearUsuario(req, res, next) {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    if (usuariosService.obtenerUsuarioPorEmail(datos.email)) {
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

module.exports = { crearUsuario };
