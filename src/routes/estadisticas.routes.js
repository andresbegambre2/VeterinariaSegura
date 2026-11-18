const express = require("express");
const { consultar } = require("../config/database");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");
const propietarios = require("../services/propietarios.service");
const veterinarios = require("../services/veterinarios.service");

const router = express.Router();

router.get("/resumen", autenticarJWT, autorizarRoles("administrador", "veterinario", "propietario"), async (req, res, next) => {
  try {
    let resultado;
    if (req.usuario.rol === "administrador") {
      resultado = await consultar(`
        SELECT
          (SELECT COUNT(*)::int FROM public.usuarios) AS usuarios,
          (SELECT COUNT(*)::int FROM public.veterinarios) AS veterinarios,
          (SELECT COUNT(*)::int FROM public.propietarios) AS propietarios,
          (SELECT COUNT(*)::int FROM public.mascotas) AS mascotas,
          (SELECT COUNT(*)::int FROM public.citas) AS citas
      `);
    } else if (req.usuario.rol === "veterinario") {
      const perfil = await veterinarios.getByUsuarioId(req.usuario.id);
      if (!perfil) return res.status(403).json({ mensaje: "La cuenta no tiene un perfil veterinario asociado" });
      resultado = await consultar(`
        SELECT
          COUNT(DISTINCT c.mascota_id)::int AS mascotas,
          COUNT(c.id)::int AS citas,
          COUNT(c.id) FILTER (WHERE c.estado = 'programada')::int AS programadas,
          COUNT(c.id) FILTER (WHERE c.estado = 'atendida')::int AS atendidas
        FROM public.citas c
        WHERE c.veterinario_id = $1
      `, [perfil.id]);
    } else {
      const perfil = await propietarios.getByUsuarioId(req.usuario.id);
      if (!perfil) return res.status(403).json({ mensaje: "La cuenta no tiene un perfil propietario asociado" });
      resultado = await consultar(`
        SELECT
          (SELECT COUNT(*)::int FROM public.mascotas WHERE propietario_id = $1) AS mascotas,
          COUNT(c.id)::int AS citas,
          COUNT(c.id) FILTER (WHERE c.estado = 'programada')::int AS programadas,
          COUNT(c.id) FILTER (WHERE c.estado = 'atendida')::int AS atendidas
        FROM public.citas c
        INNER JOIN public.mascotas m ON m.id = c.mascota_id
        WHERE m.propietario_id = $1
      `, [perfil.id]);
    }
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ resumen: resultado.rows[0] });
  } catch (error) { return next(error); }
});

module.exports = router;
