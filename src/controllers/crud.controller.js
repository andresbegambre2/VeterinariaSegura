const { matchedData } = require('express-validator');
function crudController(service) {
  return {
    getAll: async (req,res) => res.json(await service.getAll()),
    getById: async (req,res) => res.json(await service.getById(req.params.id)),
    create: async (req,res) => res.status(201).json(await service.create(matchedData(req,{locations:['body']}))),
    update: async (req,res) => res.json(await service.update(req.params.id,matchedData(req,{locations:['body']}))),
    remove: async (req,res) => res.json(await service.remove(req.params.id))
  };
}
module.exports = crudController;
