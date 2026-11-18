const { matchedData } = require("express-validator");
const recuperacionService = require("../services/recuperacion.service");

const generarCodigos = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    const codigos = await recuperacionService.generarCodigos(
      req.usuario.id,
      datos.cantidad || 8
    );

    return res.status(201).json({
      mensaje: "Códigos de recuperación generados",
      advertencia: "Guarde estos códigos ahora; no volverán a mostrarse.",
      codigos
    });
  } catch (error) {
    return next(error);
  }
};

const restablecerConCodigo = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    await recuperacionService.restablecerConCodigo(datos);
    return res.status(200).json({
      mensaje: "Contraseña restablecida. Inicie sesión nuevamente."
    });
  } catch (error) {
    return next(error);
  }
};

const emitirTokenAdministrativo = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["params"] });
    const resultado = await recuperacionService.emitirTokenAdministrativo({
      administradorId: req.usuario.id,
      usuarioId: datos.id
    });

    return res.status(201).json({
      mensaje: "Token temporal de recuperación generado",
      token: resultado.token,
      fechaExpiracion: resultado.fechaExpiracion,
      advertencia: "Entregue el token por un canal seguro; no volverá a mostrarse."
    });
  } catch (error) {
    return next(error);
  }
};

const restablecerConToken = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    await recuperacionService.restablecerConToken(datos);
    return res.status(200).json({
      mensaje: "Contraseña restablecida. Inicie sesión nuevamente."
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generarCodigos,
  restablecerConCodigo,
  emitirTokenAdministrativo,
  restablecerConToken
};
