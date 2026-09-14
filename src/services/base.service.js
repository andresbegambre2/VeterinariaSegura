const HttpError = require("./http-error");

const nextId = (items) => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

function createCrudService(items, resourceName, hooks = {}) {
  const getById = (id) => items.find((item) => item.id === Number(id));

  return {
    getAll: () => items,
    getById(id) {
      const item = getById(id);
      if (!item) throw new HttpError(404, `${resourceName} no encontrado`);
      return item;
    },
    create(data) {
      hooks.validate?.(data);
      const item = { id: nextId(items), ...data };
      items.push(item);
      return item;
    },
    update(id, data) {
      const index = items.findIndex((item) => item.id === Number(id));
      if (index < 0) throw new HttpError(404, `${resourceName} no encontrado`);
      hooks.validate?.(data, Number(id));
      items[index] = { id: Number(id), ...data };
      return items[index];
    },
    remove(id) {
      const index = items.findIndex((item) => item.id === Number(id));
      if (index < 0) throw new HttpError(404, `${resourceName} no encontrado`);
      hooks.beforeRemove?.(Number(id));
      return items.splice(index, 1)[0];
    }
  };
}

module.exports = createCrudService;
