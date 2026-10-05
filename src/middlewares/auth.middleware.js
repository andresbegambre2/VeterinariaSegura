const { verificarToken } = require("../utils/jwt.util");

function autenticarJWT(req, res, next) {
  const authorization = req.get("Authorization");

  if (!authorization) {
    return res.status(401).json({ mensaje: "Token de autenticación requerido" });
  }

  const partes = authorization.split(" ");
  if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
    return res.status(401).json({ mensaje: "Formato de token inválido" });
  }

  try {
    const payload = verificarToken(partes[1]);
    req.usuario = {
      id: Number(payload.sub),
      email: payload.email,
      rol: payload.rol
    };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ mensaje: "Token expirado" });
    }
    return res.status(401).json({ mensaje: "Token inválido" });
  }
}

module.exports = autenticarJWT;
