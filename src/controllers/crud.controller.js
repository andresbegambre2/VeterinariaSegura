function crudController(service) {
  return {
    getAll: (req, res) => res.json(service.getAll()),
    getById: (req, res) => res.json(service.getById(req.params.id)),
    create: (req, res) => res.status(201).json(service.create(req.body)),
    update: (req, res) => res.json(service.update(req.params.id, req.body)),
    remove: (req, res) => res.json(service.remove(req.params.id))
  };
}

module.exports = crudController;
