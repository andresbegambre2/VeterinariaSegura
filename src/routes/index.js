const express = require("express");
const { param } = require("express-validator");
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
  (req, res) => res.json(propietarios.getMascotas(req.params.id)));
propietariosRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarPropietarioPropio, propietariosController.getById);
propietariosRouter.post("/", autenticarJWT, soloAdministrador, validators.propietario, validate, propietariosController.create);
propietariosRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.propietario, validate, propietariosController.update);
propietariosRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, propietariosController.remove);

const mascotasRouter = express.Router();
mascotasRouter.get("/", autenticarJWT, autorizarRoles("administrador", "veterinario"), mascotasController.getAll);
mascotasRouter.get("/:id/citas", autenticarJWT, autorizarRoles("administrador", "propietario"), validators.id, validate, autorizarCitasMascotaPropia,
  (req, res) => res.json(mascotas.getCitas(req.params.id)));
mascotasRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarMascotaPropia, mascotasController.getById);
mascotasRouter.post("/", autenticarJWT, soloAdministrador, validators.mascota, validate, mascotasController.create);
mascotasRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.mascota, validate, mascotasController.update);
mascotasRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, mascotasController.remove);

const veterinariosRouter = express.Router();
veterinariosRouter.get("/", autenticarJWT, lecturaGeneral, veterinariosController.getAll);
veterinariosRouter.get("/:id/citas", autenticarJWT, autorizarRoles("administrador", "veterinario"), validators.id, validate, autorizarVeterinarioPropio,
  (req, res) => res.json(veterinarios.getCitas(req.params.id)));
veterinariosRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, veterinariosController.getById);
veterinariosRouter.post("/", autenticarJWT, soloAdministrador, validators.veterinario, validate, veterinariosController.create);
veterinariosRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.veterinario, validate, veterinariosController.update);
veterinariosRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, veterinariosController.remove);

const citasRouter = express.Router();
citasRouter.get("/", autenticarJWT, soloAdministrador, citasController.getAll);
citasRouter.get("/mis-citas", autenticarJWT, autorizarRoles("propietario", "veterinario"), (req, res) => {
  if (req.usuario.rol === "propietario") {
    const perfil = propietarios.getByUsuarioId(req.usuario.id);
    if (!perfil) return res.status(403).json({ mensaje: "El usuario no tiene un propietario asociado" });
    return res.json(citas.getByPropietarioId(perfil.id));
  }
  const perfil = veterinarios.getByUsuarioId(req.usuario.id);
  if (!perfil) return res.status(403).json({ mensaje: "El usuario no tiene un veterinario asociado" });
  return res.json(citas.getByVeterinarioId(perfil.id));
});
citasRouter.get(
  "/propietario/:propietarioId",
  autenticarJWT,
  autorizarRoles("administrador", "propietario"),
  param("propietarioId").isInt({ min: 1 }).toInt(),
  validate,
  autorizarPropietarioPropio,
  (req, res) => res.json(citas.getByPropietarioId(req.params.propietarioId))
);
citasRouter.get(
  "/veterinario/:veterinarioId",
  autenticarJWT,
  autorizarRoles("administrador", "veterinario"),
  param("veterinarioId").isInt({ min: 1 }).toInt(),
  validate,
  autorizarVeterinarioPropio,
  (req, res) => res.json(citas.getByVeterinarioId(req.params.veterinarioId))
);
citasRouter.get("/:id", autenticarJWT, lecturaGeneral, validators.id, validate, autorizarAccesoCita, citasController.getById);
citasRouter.post("/", autenticarJWT, soloAdministrador, validators.cita, validate, citasController.create);
citasRouter.put("/:id", autenticarJWT, soloAdministrador, validators.id, validators.cita, validate, citasController.update);
citasRouter.patch("/:id/estado", autenticarJWT, soloAdministrador, validators.id, validators.estado, validate,
  (req, res) => res.json(citas.updateEstado(req.params.id, req.body.estado)));
citasRouter.delete("/:id", autenticarJWT, soloAdministrador, validators.id, validate, citasController.remove);

router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/propietarios", propietariosRouter);
router.use("/mascotas", mascotasRouter);
router.use("/veterinarios", veterinariosRouter);
router.use("/citas", citasRouter);
router.use("/seguridad", seguridadRoutes);

module.exports = router;
