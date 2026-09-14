# Requisitos del proyecto integrador

Fuente funcional: `Veterinaria_AndresSara (2).pdf`.

El proyecto debe implementar una API REST segura para administrar:

- propietarios: `id`, `nombre`, `documento`, `telefono`, `correo`;
- mascotas: `id`, `nombre`, `especie`, `raza`, `edad`, `propietarioId`;
- veterinarios: `id`, `nombre`, `documento`, `especialidad`, `telefono`, `correo`;
- citas: `id`, `fecha`, `hora`, `motivo`, `estado`, `mascotaId`, `veterinarioId`.

## Relaciones y reglas de negocio

- Un propietario puede tener varias mascotas y cada mascota pertenece a un propietario.
- Una mascota puede tener varias citas.
- Cada cita relaciona una mascota con un veterinario.
- No se permite crear una mascota con un propietario inexistente.
- No se permite crear una cita con una mascota o un veterinario inexistentes.
- Un veterinario no puede tener dos citas en la misma fecha y hora.
- Una cita atendida no puede cancelarse.
- Los estados permitidos son `programada`, `confirmada`, `atendida` y `cancelada`.
- Los documentos no se pueden duplicar.

## Endpoints requeridos

- CRUD de `/api/propietarios`.
- CRUD de `/api/mascotas`.
- CRUD de `/api/veterinarios`.
- CRUD de `/api/citas`.
- `GET /api/propietarios/{id}/mascotas`.
- `GET /api/mascotas/{id}/citas`.
- `GET /api/veterinarios/{id}/citas`.
- `PATCH /api/citas/{id}/estado`.

## Criterios técnicos

- Arquitectura por capas: rutas, validadores, controladores, servicios y datos/modelos.
- Documentación OpenAPI y Swagger UI.
- Pruebas de casos válidos, datos inválidos, IDs inexistentes y reglas de negocio.
- Controles de seguridad reutilizados de los laboratorios: Helmet, CORS restringido, límite de solicitudes, límite de tamaño JSON, validación por lista permitida y manejo seguro de errores.
- Verificaciones SAST, SCA y DAST antes de la entrega.

## Distinción de fuentes

El contenido inicial de `src/` proviene de `API_HOSPITAL.zip` y funciona únicamente como guía de arquitectura y seguridad. Sus recursos hospitalarios (pacientes, médicos, especialidades y consultorios) no forman parte de los requisitos finales y deberán sustituirse por los cuatro recursos veterinarios anteriores.
