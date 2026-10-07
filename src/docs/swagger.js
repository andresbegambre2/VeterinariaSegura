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
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT obtenido mediante el endpoint de login."
        }
      },
      schemas: {
        Propietario: { type: "object", required: ["nombre", "documento", "telefono", "correo"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, documento: { type: "string" }, telefono: { type: "string" }, correo: { type: "string", format: "email" }, usuarioId: { type: "integer", nullable: true, description: "Usuario con rol propietario asociado" } } },
        Mascota: { type: "object", required: ["nombre", "especie", "raza", "edad", "propietarioId"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, especie: { type: "string" }, raza: { type: "string" }, edad: { type: "number", minimum: 0 }, propietarioId: { type: "integer" } } },
        Veterinario: { type: "object", required: ["nombre", "documento", "especialidad", "telefono", "correo"], properties: { id: { type: "integer", readOnly: true }, nombre: { type: "string" }, documento: { type: "string" }, especialidad: { type: "string" }, telefono: { type: "string" }, correo: { type: "string", format: "email" }, usuarioId: { type: "integer", nullable: true, description: "Usuario con rol veterinario asociado" } } },
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

spec.tags = [
  ...(spec.tags || []),
  { name: "Autenticación", description: "Registro e inicio de sesión de usuarios de VeterinariaSegura" }
];
spec.components.schemas.RegistroUsuario = {
  type: "object",
  additionalProperties: false,
  required: ["nombre", "email", "password"],
  properties: {
    nombre: { type: "string", minLength: 3, maxLength: 100, example: "Dra. Laura Gómez" },
    email: { type: "string", format: "email", example: "laura@veterinaria.com" },
    password: { type: "string", format: "password", minLength: 10, maxLength: 72, example: "ClaveSegura2026!" }
  }
};
spec.components.schemas.LoginUsuario = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", example: "laura@veterinaria.com" },
    password: { type: "string", format: "password", example: "ClaveSegura2026!" }
  }
};
spec.paths["/api/auth/registro"] = {
  post: {
    tags: ["Autenticación"], summary: "Registrar un usuario",
    description: "Registra un nuevo usuario utilizando bcrypt para proteger la contraseña. El rol propietario es asignado por el servidor y no puede ser definido por el cliente.",
    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegistroUsuario" } } } },
    responses: { 201: { description: "Usuario registrado" }, 400: { description: "Datos inválidos" }, 409: { description: "Email duplicado" } }
  }
};
spec.paths["/api/auth/login"] = {
  post: {
    tags: ["Autenticación"], summary: "Iniciar sesión", description: "Verifica las credenciales y genera un JWT temporal para acceder a rutas protegidas.",
    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginUsuario" } } } },
    responses: { 200: { description: "Autenticación correcta" }, 400: { description: "Datos inválidos" }, 401: { description: "Credenciales inválidas" }, 403: { description: "Usuario deshabilitado" } }
  }
};
spec.paths["/api/auth/perfil"] = {
  get: {
    tags: ["Autenticación"],
    summary: "Obtener perfil del usuario autenticado",
    description: "Requiere API Key y un JWT válido.",
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
    responses: {
      200: { description: "Usuario autenticado correctamente" },
      401: { description: "Credenciales de autenticación ausentes o inválidas" }
    }
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

spec.tags.push({ name: "Usuarios", description: "Gestión administrativa de usuarios privilegiados" });
spec.components.schemas.UsuarioAdministrativo = {
  type: "object",
  additionalProperties: false,
  required: ["nombre", "email", "password", "rol"],
  properties: {
    nombre: { type: "string", minLength: 3, maxLength: 100 },
    email: { type: "string", format: "email" },
    password: { type: "string", format: "password", minLength: 10, maxLength: 72 },
    rol: { type: "string", enum: ["veterinario", "administrador"] }
  }
};
spec.paths["/api/usuarios"] = {
  post: {
    tags: ["Usuarios"],
    summary: "Crear un usuario privilegiado",
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioAdministrativo" } } } },
    responses: {
      201: { description: "Usuario creado" },
      400: { description: "Datos inválidos" },
      401: { description: "Usuario no autenticado" },
      403: { description: "Operación reservada al administrador" },
      409: { description: "Correo ya registrado" }
    }
  }
};
spec.paths["/api/citas/mis-citas"] = {
  get: {
    tags: ["Cita"],
    summary: "Obtener las citas del usuario autenticado",
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
    responses: {
      200: { description: "Citas propias" },
      401: { description: "Usuario no autenticado" },
      403: { description: "Usuario sin perfil asociado o sin permiso" }
    }
  }
};
spec.paths["/api/citas/propietario/{propietarioId}"] = {
  get: {
    tags: ["Cita"],
    summary: "Obtener citas de un propietario con control BOLA",
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
    parameters: [{ name: "propietarioId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    responses: { 200: { description: "Citas autorizadas" }, 401: { description: "No autenticado" }, 403: { description: "Recurso ajeno" } }
  }
};
spec.paths["/api/citas/veterinario/{veterinarioId}"] = {
  get: {
    tags: ["Cita"],
    summary: "Obtener citas de un veterinario con control BOLA",
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
    parameters: [{ name: "veterinarioId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    responses: { 200: { description: "Citas autorizadas" }, 401: { description: "No autenticado" }, 403: { description: "Recurso ajeno" } }
  }
};

for (const [ruta, operaciones] of Object.entries(spec.paths)) {
  if (/^\/api\/(propietarios|mascotas|veterinarios|citas)(\/|$)/.test(ruta)) {
    for (const operacion of Object.values(operaciones)) {
      if (operacion && typeof operacion === "object" && !Array.isArray(operacion) && operacion.responses) {
        operacion.security = [{ ApiKeyAuth: [], BearerAuth: [] }];
        operacion.responses[401] ||= { description: "Usuario no autenticado" };
        operacion.responses[403] ||= { description: "Usuario sin permisos sobre el recurso" };
      }
    }
  }
}

module.exports = spec;
