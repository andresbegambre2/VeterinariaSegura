const mascotasService = require("../services/mascotas.service");
const mismoId = (a,b) => a != null && b != null && String(a) === String(b);
const propietariosService = require("../services/propietarios.service");
const veterinariosService = require("../services/veterinarios.service");
const citasService = require("../services/citas.service");

const prohibido = (res, mensaje = "No tiene permisos para acceder a este recurso") =>
  res.status(403).json({ mensaje });

async function obtenerPropietarioAutenticado(req) {
  return propietariosService.getByUsuarioId(req.usuario.id);
}

async function obtenerVeterinarioAutenticado(req) {
  return veterinariosService.getByUsuarioId(req.usuario.id);
}

async function autorizarPropietarioPropio(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (["administrador", "veterinario"].includes(req.usuario.rol)) return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = await obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const solicitado = (req.params.propietarioId || req.params.id);
  return mismoId(perfil.id,solicitado) ? next() : prohibido(res);
}

async function autorizarVeterinarioPropio(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol !== "veterinario") return prohibido(res);
  const perfil = await obtenerVeterinarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un veterinario asociado");
  const solicitado = (req.params.veterinarioId || req.params.id);
  return mismoId(perfil.id,solicitado) ? next() : prohibido(res);
}

async function autorizarMascotaPropia(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (["administrador", "veterinario"].includes(req.usuario.rol)) return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = await obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const mascota = await mascotasService.getById(req.params.id);
  if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada" });
  return mismoId(mascota.propietarioId,perfil.id) ? next() : prohibido(res);
}

async function autorizarCitasMascotaPropia(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol !== "propietario") return prohibido(res);
  const perfil = await obtenerPropietarioAutenticado(req);
  if (!perfil) return prohibido(res, "El usuario no tiene un propietario asociado");
  const mascota = await mascotasService.getById(req.params.id);
  if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada" });
  return mismoId(mascota.propietarioId,perfil.id) ? next() : prohibido(res);
}

async function autorizarAccesoCita(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: "Usuario no autenticado" });
  let cita;
  try {
    cita = await citasService.getById(req.params.id);
  } catch (error) {
    return next(error);
  }
  if (req.usuario.rol === "administrador") return next();
  if (req.usuario.rol === "veterinario") {
    const perfil = await obtenerVeterinarioAutenticado(req);
    return perfil && mismoId(perfil.id,cita.veterinarioId) ? next() : prohibido(res, "No tiene permisos para acceder a esta cita");
  }
  if (req.usuario.rol === "propietario") {
    const perfil = await obtenerPropietarioAutenticado(req);
    const mascota = await mascotasService.getById(cita.mascotaId);
    return perfil && mascota && mismoId(perfil.id,mascota.propietarioId)
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
