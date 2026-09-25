const { matchedData } = require("express-validator");
const usuariosService = require("../services/usuarios.service");

const respuestaSegura = ({ id, nombre, email, rol, activo }) => ({ id, nombre, email, rol, activo });

async function registrar(req, res, next) {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    if (usuariosService.obtenerUsuarioPorEmail(datos.email)) {
      return res.status(409).json({ mensaje: "Ya existe un usuario con ese correo electrónico" });
    }
    const usuario = await usuariosService.crearUsuario(datos);
    return res.status(201).json({ mensaje: "Usuario registrado correctamente", usuario: respuestaSegura(usuario) });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    const usuario = await usuariosService.verificarCredenciales(datos.email, datos.password);
    if (!usuario) return res.status(401).json({ mensaje: "Credenciales inválidas" });
    if (!usuario.activo) return res.status(403).json({ mensaje: "Usuario deshabilitado" });
    return res.status(200).json({ mensaje: "Autenticación correcta", usuario: respuestaSegura(usuario) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { registrar, login };
