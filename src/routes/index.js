const express = require("express");
const crudController = require("../controllers/crud.controller");
const crudRoutes = require("./crud.routes");
const validate = require("../middlewares/validate");
const validators = require("../middlewares/validators");
const propietarios = require("../services/propietarios.service");
const mascotas = require("../services/mascotas.service");
const veterinarios = require("../services/veterinarios.service");
const citas = require("../services/citas.service");
const seguridadRoutes = require("./seguridad.routes");

const router = express.Router();
const propietariosRouter = crudRoutes(crudController(propietarios), "propietario");
const mascotasRouter = crudRoutes(crudController(mascotas), "mascota");
const veterinariosRouter = crudRoutes(crudController(veterinarios), "veterinario");
const citasRouter = crudRoutes(crudController(citas), "cita");

propietariosRouter.get("/:id/mascotas", validators.id, validate, (req, res) => res.json(propietarios.getMascotas(req.params.id)));
mascotasRouter.get("/:id/citas", validators.id, validate, (req, res) => res.json(mascotas.getCitas(req.params.id)));
veterinariosRouter.get("/:id/citas", validators.id, validate, (req, res) => res.json(veterinarios.getCitas(req.params.id)));
citasRouter.patch("/:id/estado", validators.id, validators.estado, validate, (req, res) => res.json(citas.updateEstado(req.params.id, req.body.estado)));

router.use("/propietarios", propietariosRouter);
router.use("/mascotas", mascotasRouter);
router.use("/veterinarios", veterinariosRouter);
router.use("/citas", citasRouter);
router.use("/seguridad", seguridadRoutes);

module.exports = router;
