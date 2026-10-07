const { matchedData } = require("express-validator");

function crudController(service) {
  return {
    getAll: (req, res) => res.json(service.getAll()),
    getById: (req, res) => res.json(service.getById(req.params.id)),
    create: (req, res) => res.status(201).json(service.create(matchedData(req, { locations: ["body"] }))),
    update: (req, res) => res.json(service.update(req.params.id, matchedData(req, { locations: ["body"] }))),
    remove: (req, res) => res.json(service.remove(req.params.id))
  };
}

module.exports = crudController;
