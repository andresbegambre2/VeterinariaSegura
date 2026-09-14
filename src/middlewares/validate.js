const { validationResult, matchedData } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ mensaje: "Datos inválidos", errores: errors.array() });
  req.body = matchedData(req, { locations: ["body"] });
  next();
}

module.exports = validate;
