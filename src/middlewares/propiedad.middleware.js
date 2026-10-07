const { store } = require("../data/store");
const propietariosService = require("../services/propietarios.service");
const veterinariosService = require("../services/veterinarios.service");
const citasService = require("../services/citas.service");

const prohibido = (res, mensaje = "No tiene permisos para acceder a este recurso") =>
  res.status(403).json({ mensaje });

function obtenerPropietarioAutenticado(req) {
  return propietariosService.getByUsuarioId(req.usuario.id);
}

function obtenerVeterinarioAutenticado(req) {
  return veterinariosService.getByUsuarioId(req.usuario.id);
}

function autorizarPropietarioPropio(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (["administrador", "veterinario"].includes(req.usuario.rol)) return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const solicitado = Number(req.params.propietarioId || req.params.id);
  return perfil.id === solicitado ? next() : prohibido(res);
}

function autorizarVeterinarioPropio(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol !== "veterinario") return prohibido(res);
  const perfil = obtenerVeterinarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un veterinario asociado");
  const solicitado = Number(req.params.veterinarioId || req.params.id);
  return perfil.id === solicitado ? next() : prohibido(res);
}

function autorizarMascotaPropia(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (["administrador", "veterinario"].includes(req.usuario.rol)) return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const mascota = store.mascotas.find((item) => item.id === Number(req.params.id));
  if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada" });
  return mascota.propietarioId === perfil.id ? next() : prohibido(res);
}

function autorizarCitasMascotaPropia(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const mascota = store.mascotas.find((item) => item.id === Number(req.params.id));
  if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada" });
  return mascota.propietarioId === perfil.id ? next() : prohibido(res);
}

function autorizarAccesoCita(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  let cita;
  try {
    cita = citasService.getById(req.params.id);
  } catch (error) {
    return next(error);
  }
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol === "veterinario") {
    const perfil = obtenerVeterinarioAutenticado(req);
    return perfil && perfil.id === cita.veterinarioId ? next() : prohibido(res, "No tiene permisos para acceder a esta cita");
  }
  if (req.usuario.rol === "propietario") {
    const perfil = obtenerPropietarioAutenticado(req);
    const mascota = store.mascotas.find((item) => item.id === cita.mascotaId);
    return perfil && mascota && perfil.id === mascota.propietarioId
      ? next()
      : prohibido(res, "No tiene permisos para acceder a esta cita");
  }
  return prohibido(res, "No tiene permisos para acceder a esta cita");
}

module.exports = {
  autorizarPropietarioPropio,
  autorizarVeterinarioPropio,
  autorizarMascotaPropia,
  autorizarCitasMascotaPropia,
  autorizarAccesoCita
};
