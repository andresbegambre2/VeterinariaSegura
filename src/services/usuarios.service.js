const { usuarios } = require("../data/usuarios");
const { generarPasswordHash, verificarPassword } = require("../utils/password.util");

function obtenerUsuarioPorEmail(email) {
  return usuarios.find((usuario) => usuario.email === email.toLowerCase());
}

async function crearUsuario(datos) {
  const usuario = {
    id: usuarios.length ? Math.max(...usuarios.map(({ id }) => id)) + 1 : 1,
    nombre: datos.nombre,
    email: datos.email.toLowerCase(),
    passwordHash: await generarPasswordHash(datos.password),
    rol: datos.rol,
    activo: true
  };
  usuarios.push(usuario);
  return usuario;
}

async function verificarCredenciales(email, password) {
  const usuario = obtenerUsuarioPorEmail(email);
  if (!usuario) return null;
  return (await verificarPassword(password, usuario.passwordHash)) ? usuario : null;
}

module.exports = { obtenerUsuarioPorEmail, crearUsuario, verificarCredenciales };
