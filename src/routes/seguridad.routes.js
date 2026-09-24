const express = require("express");

const router = express.Router();

router.get("/cliente", (req, res) => {
  res.status(200).json({ mensaje: "Cliente autenticado", cliente: req.clienteApi });
});

module.exports = router;
