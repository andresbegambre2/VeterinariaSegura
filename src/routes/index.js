const express = require("express");
const { matchedData, param } = require("express-validator");
const crudController = require("../controllers/crud.controller");
const validate = require("../middlewares/validate");
const validators = require("../middlewares/validators");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");
const {
  autorizarPropietarioPropio,
  autorizarVeterinarioPropio,
  autorizarMascotaPropia,
  autorizarCitasMascotaPropia,
  autorizarAccesoCita
} = require("../middlewares/propiedad.middleware");
const propietarios = require("../services/propietarios.service");
const mascotas = require("../services/mascotas.service");
const veterinarios = require("../services/veterinarios.service");
const citas = require("../services/citas.service");
const seguridadRoutes = require("./seguridad.routes");
const authRoutes = require("./auth.routes");
const usuariosRoutes = require("./usuarios.routes");

const router = express.Router();
const propietariosController = crudController(propietarios);
const mascotasController = crudController(mascotas);
const veterinariosController = crudController(veterinarios);
const citasController = crudController(citas);
const soloAdministrador = autorizarRoles("administrador");
const lecturaGeneral = autorizarRoles("administrador", "veterinario", "propietario");

const propietariosRouter = express.Router();
propietariosRouter.get("/", autenticarJWT, autorizarRoles("administrador", "veterinario"), propietariosController.getAll);
propietariosRouter.get("/:id/mascotas", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarPropietarioPropio,
  async (req, res) => res.json(await propietarios.getMascotas(req.params.id)));
propietariosRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarPropietarioPropio, propietariosController.getById);
propietariosRouter.post("/", autenticarJWT, soloAdministrador, validators.propietario, validate, propietariosController.create);
propietariosRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.propietario, validate, propietariosController.update);
propietariosRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, propietariosController.remove);

const mascotasRouter = express.Router();
mascotasRouter.get("/", autenticarJWT, autorizarRoles("administrador", "veterinario"), mascotasController.getAll);
mascotasRouter.get("/:id/citas", autenticarJWT, autorizarRoles("administrador", "propietario"), validators.id, validate, autorizarCitasMascotaPropia,
  async (req, res) => res.json(await mascotas.getCitas(req.params.id)));
mascotasRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarMascotaPropia, mascotasController.getById);
mascotasRouter.post("/", autenticarJWT, soloAdministrador, validators.mascota, validate, mascotasController.create);
mascotasRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.mascota, validate, mascotasController.update);
mascotasRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, mascotasController.remove);

const veterinariosRouter = express.Router();
veterinariosRouter.get("/", autenticarJWT, lecturaGeneral, veterinariosController.getAll);
veterinariosRouter.get("/:id/citas", autenticarJWT, autorizarRoles("administrador", "veterinario"), validators.id, validate, autorizarVeterinarioPropio,
  async (req, res) => res.json(await veterinarios.getCitas(req.params.id)));
veterinariosRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, veterinariosController.getById);
veterinariosRouter.post("/", autenticarJWT, soloAdministrador, validators.veterinario, validate, veterinariosController.create);
veterinariosRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.veterinario, validate, veterinariosController.update);
veterinariosRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, veterinariosController.remove);

const citasRouter = express.Router();
citasRouter.post(
  "/mis-solicitudes",
  autenticarJWT,
  autorizarRoles("propietario"),
  validators.cita,
  validate,
  async (req, res, next) => {
    try {
      const perfil = await propietarios.getByUsuarioId(req.usuario.id);
      if (!perfil) return res.status(403).json({ mensaje: "Debes vincular tu cuenta a un perfil de propietario antes de solicitar una cita" });
      const datos = matchedData(req, { locations: ["body"] });
      const mascota = await mascotas.getById(datos.mascotaId);
      if (String(mascota.propietarioId) !== String(perfil.id)) return res.status(403).json({ mensaje: "Solo puedes solicitar citas para tus propias mascotas" });
      const fechaHora = new Date(`${datos.fecha}T${datos.hora}:00-05:00`);
      if (!Number.isFinite(fechaHora.getTime()) || fechaHora <= new Date()) return res.status(400).json({ mensaje: "Selecciona una fecha y hora futuras" });
      const cita = await citas.create({ fecha: datos.fecha, hora: datos.hora, motivo: datos.motivo, mascotaId: datos.mascotaId, veterinarioId: datos.veterinarioId });
      return res.status(201).json({ mensaje: "Cita solicitada correctamente", cita });
    } catch (error) { return next(error); }
  }
);

const cambiarEstadoPropio = (estado) => async (req, res, next) => {
  try {
    const cita = await citas.cambiarEstadoPropio({ citaId: req.params.id, usuarioId: req.usuario.id, rol: req.usuario.rol, estado });
    if (!cita) return res.status(409).json({ mensaje: "No se permite esta transición para la cita" });
    return res.status(200).json({ mensaje: "Estado actualizado correctamente", cita });
  } catch (error) { return next(error); }
};

citasRouter.patch("/:id/cancelar", autenticarJWT, autorizarRoles("propietario"), validators.id, validate, autorizarAccesoCita, cambiarEstadoPropio("cancelada"));
citasRouter.patch("/:id/confirmar", autenticarJWT, autorizarRoles("veterinario"), validators.id, validate, autorizarAccesoCita, cambiarEstadoPropio("confirmada"));
citasRouter.patch("/:id/atender", autenticarJWT, autorizarRoles("veterinario"), validators.id, validate, autorizarAccesoCita, cambiarEstadoPropio("atendida"));
citasRouter.get("/", autenticarJWT, soloAdministrador, citasController.getAll);
citasRouter.get("/mis-citas", autenticarJWT, autorizarRoles("propietario", "veterinario"), async (req, res) => {
  if (req.usuario.rol === "propietario") {
    const perfil = await propietarios.getByUsuarioId(req.usuario.id);
    if (!perfil) return res.status(403).json({ mensaje: "El usuario no tiene un propietario asociado" });
    return res.json(await citas.getByPropietarioId(perfil.id));
  }
  const perfil = await veterinarios.getByUsuarioId(req.usuario.id);
  if (!perfil) return res.status(403).json({ mensaje: "El usuario no tiene un veterinario asociado" });
  return res.json(await citas.getByVeterinarioId(perfil.id));
});
citasRouter.get(
  "/propietario/:propietarioId",
  autenticarJWT,
  autorizarRoles("administrador", "propietario"),
  param("propietarioId").custom(validators.esId),
  validate,
  autorizarPropietarioPropio,
  async (req, res) => res.json(await citas.getByPropietarioId(req.params.propietarioId))
);
citasRouter.get(
  "/veterinario/:veterinarioId",
  autenticarJWT,
  autorizarRoles("administrador", "veterinario"),
  param("veterinarioId").custom(validators.esId),
  validate,
  autorizarVeterinarioPropio,
  async (req, res) => res.json(await citas.getByVeterinarioId(req.params.veterinarioId))
);
citasRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarAccesoCita, citasController.getById);
citasRouter.post("/", autenticarJWT, soloAdministrador, validators.cita, validate, citasController.create);
citasRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.cita, validate, citasController.update);
citasRouter.patch("/:id/estado", autenticarJWT, soloAdministrador, validators.id, validators.estado, validate,
  async (req, res) => res.json(await citas.updateEstado(req.params.id, matchedData(req, { locations: ["body"] }).estado)));
citasRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, citasController.remove);

router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/estadisticas", require("./estadisticas.routes"));
router.use("/propietarios", propietariosRouter);
router.use("/mascotas", mascotasRouter);
router.use("/veterinarios", veterinariosRouter);
router.use("/citas", citasRouter);
router.use("/seguridad", seguridadRoutes);

module.exports = router;
