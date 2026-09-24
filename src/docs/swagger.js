const swaggerJsdoc = require("swagger-jsdoc");

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "VeterinariaSegura API", version: "1.0.0", description: "API REST segura para propietarios, mascotas, veterinarios y citas." },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key requerida para consumir los endpoints protegidos."
        }
      },
      schemas: {
        Propietario: { type: "object", required: ["nombre", "documento", "telefono", "correo"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, documento: { type: "string" }, telefono: { type: "string" }, correo: { type: "string", format: "email" } } },
        Mascota: { type: "object", required: ["nombre", "especie", "raza", "edad", "propietarioId"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, especie: { type: "string" }, raza: { type: "string" }, edad: { type: "number", minimum: 0 }, propietarioId: { type: "integer" } } },
        Veterinario: { type: "object", required: ["nombre", "documento", "especialidad", "telefono", "correo"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, documento: { type: "string" }, especialidad: { type: "string" }, telefono: { type: "string" }, correo: { type: "string", format: "email" } } },
        Cita: { type: "object", required: ["fecha", "hora", "motivo", "estado", "mascotaId", "veterinarioId"], properties: { id: { type: "integer", readOnly: true }, fecha: { type: "string", format: "date" }, hora: { type: "string", example: "09:00" }, motivo: { type: "string" }, estado: { type: "string", enum: ["programada", "confirmada", "atendida", "cancelada"] }, mascotaId: { type: "integer" }, veterinarioId: { type: "integer" } } }
      }
    },
    security: [{ ApiKeyAuth: [] }],
    paths: Object.fromEntries([
      ["propietarios", "Propietario"], ["mascotas", "Mascota"], ["veterinarios", "Veterinario"], ["citas", "Cita"]
    ].flatMap(([path, schema]) => [
      [`/api/${path}`, { get: { tags: [schema], responses: { 200: { description: "Listado correcto" } } }, post: { tags: [schema], requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } }, responses: { 201: { description: "Creado" }, 400: { description: "Datos inválidos" } } } }],
      [`/api/${path}/{id}`, { parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], get: { tags: [schema], responses: { 200: { description: "Encontrado" }, 404: { description: "No encontrado" } } }, put: { tags: [schema], requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } }, responses: { 200: { description: "Actualizado" } } }, delete: { tags: [schema], responses: { 200: { description: "Eliminado" }, 409: { description: "Conflicto de integridad" } } } }]
    ]))
  },
  apis: []
});

spec.paths["/api/propietarios/{id}/mascotas"] = {
  get: { tags: ["Propietario"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Mascotas del propietario" }, 404: { description: "Propietario no encontrado" } } }
};
spec.paths["/api/mascotas/{id}/citas"] = {
  get: { tags: ["Mascota"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Citas de la mascota" }, 404: { description: "Mascota no encontrada" } } }
};
spec.paths["/api/veterinarios/{id}/citas"] = {
  get: { tags: ["Veterinario"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Citas del veterinario" }, 404: { description: "Veterinario no encontrado" } } }
};
spec.paths["/api/citas/{id}/estado"] = {
  patch: {
    tags: ["Cita"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["estado"], properties: { estado: { type: "string", enum: ["programada", "confirmada", "atendida", "cancelada"] } } } } } },
    responses: { 200: { description: "Estado actualizado" }, 400: { description: "Estado inválido" }, 409: { description: "Transición no permitida" } }
  }
};

spec.paths["/api/seguridad/cliente"] = {
  get: {
    tags: ["Seguridad"],
    summary: "Obtener el cliente autenticado",
    responses: {
      200: { description: "Cliente autenticado correctamente" },
      401: { description: "API Key ausente o inválida" },
      403: { description: "API Key deshabilitada" }
    }
  }
};

module.exports = spec;
