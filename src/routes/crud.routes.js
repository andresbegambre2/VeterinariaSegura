const express = require("express");
const validate = require("../middlewares/validate");
const validators = require("../middlewares/validators");

function crudRoutes(controller, schema) {
  const router = express.Router();
  router.get("/", controller.getAll);
  router.get("/:id", validators.id, validate, controller.getById);
  router.post("/", validators[schema], validate, controller.create);
  router.put("/:id", validators.id, validators[schema], validate, controller.update);
  router.delete("/:id", validators.id, validate, controller.remove);
  return router;
}

module.exports = crudRoutes;
