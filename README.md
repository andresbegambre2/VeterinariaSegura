# VeterinariaSegura

API REST para gestionar la información básica de una veterinaria. Permite administrar propietarios, mascotas, veterinarios y citas, aplicando validaciones, reglas de negocio y controles de seguridad.

Proyecto desarrollado por:

- Andres Leonardo Begambre Vargas
- Sara Valentina Caicedo Duarte

## Funcionalidades

- Registro, consulta, actualización y eliminación de propietarios.
- Registro, consulta, actualización y eliminación de mascotas.
- Registro, consulta, actualización y eliminación de veterinarios.
- Programación y administración de citas veterinarias.
- Consulta de mascotas asociadas a un propietario.
- Consulta de citas por mascota y por veterinario.
- Actualización del estado de una cita.
- Documentación interactiva con Swagger UI.

## Reglas de negocio

- Una mascota debe estar asociada a un propietario existente.
- Una cita debe relacionar una mascota y un veterinario existentes.
- Un veterinario no puede tener dos citas en la misma fecha y hora.
- Una cita atendida no puede cancelarse.
- Los estados permitidos son `programada`, `confirmada`, `atendida` y `cancelada`.
- Los documentos y correos de propietarios y veterinarios no pueden repetirse.
- No se puede eliminar un recurso mientras tenga registros relacionados.

## Tecnologías

- Node.js
- Express
- express-validator
- Helmet
- CORS
- express-rate-limit
- Swagger y OpenAPI 3.0
- Node Test Runner y Supertest

## Estructura

```text
VeterinariaSegura/
|-- src/
|   |-- controllers/
|   |-- data/
|   |-- docs/
|   |-- middlewares/
|   |-- routes/
|   |-- services/
|   |-- app.js
|   `-- server.js
|-- test/
|-- .env.example
|-- package.json
|-- README.md
`-- REQUISITOS.md
```

El flujo principal de una solicitud es:

```text
Solicitud -> Ruta -> Validación -> Controlador -> Servicio -> Datos
```

## Instalación

Es necesario tener Node.js instalado. Después de descargar o clonar el repositorio, se ejecutan los siguientes comandos:

```bash
npm install
```

Se puede crear un archivo `.env` tomando como referencia `.env.example`:

```env
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
```

## Ejecución

Para iniciar la API:

```bash
npm start
```

Para trabajar con reinicio automático:

```bash
npm run dev
```

Direcciones disponibles:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- Documento OpenAPI: `http://localhost:3000/openapi.json`

## Endpoints

### Propietarios

- `GET /api/propietarios`
- `GET /api/propietarios/:id`
- `POST /api/propietarios`
- `PUT /api/propietarios/:id`
- `DELETE /api/propietarios/:id`
- `GET /api/propietarios/:id/mascotas`

### Mascotas

- `GET /api/mascotas`
- `GET /api/mascotas/:id`
- `POST /api/mascotas`
- `PUT /api/mascotas/:id`
- `DELETE /api/mascotas/:id`
- `GET /api/mascotas/:id/citas`

### Veterinarios

- `GET /api/veterinarios`
- `GET /api/veterinarios/:id`
- `POST /api/veterinarios`
- `PUT /api/veterinarios/:id`
- `DELETE /api/veterinarios/:id`
- `GET /api/veterinarios/:id/citas`

### Citas

- `GET /api/citas`
- `GET /api/citas/:id`
- `POST /api/citas`
- `PUT /api/citas/:id`
- `DELETE /api/citas/:id`
- `PATCH /api/citas/:id/estado`

## Pruebas

Para ejecutar las pruebas automatizadas:

```bash
npm test
```

Las pruebas verifican los casos válidos, campos obligatorios, identificadores inexistentes, relaciones entre recursos, duplicidad de agenda, estados de citas, encabezados de seguridad y protección frente a asignación masiva.

## Seguridad

La API incluye:

- encabezados HTTP seguros con Helmet;
- eliminación del encabezado `X-Powered-By`;
- origen permitido configurable mediante CORS;
- límite de solicitudes para las rutas de la API;
- límite de 10 KB para cuerpos JSON;
- validación y normalización de datos de entrada;
- selección explícita de campos permitidos;
- manejo centralizado de errores sin exponer detalles internos.

Los datos se almacenan temporalmente en memoria, por lo que vuelven a su estado inicial cuando se reinicia el servidor.
