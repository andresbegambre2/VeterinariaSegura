# VeterinariaSegura — Bloque 7

Migración preparada de usuarios, propietarios, mascotas, veterinarios y citas a PostgreSQL en Supabase. Mantiene los endpoints, API Keys, bcrypt/JWT, roles, validación y controles de propiedad.

**Empieza por [GUIA_SUPABASE.md](GUIA_SUPABASE.md).** Contiene los pasos desde crear el proyecto hasta ejecutar SQL, configurar `.env`, instalar dependencias, probar y capturar evidencias.

**Informe de seguridad:** [pruebas SCA, SAST, DAST y API de ambos proyectos](docs/Informe_Pruebas_Seguridad.pdf).

## Cambios

- Conexión reutilizable `src/config/database.js`, pool y TLS verificado.
- SQL parametrizado y services asíncronos para todos los recursos persistidos.
- Usuarios persistentes y administrador inicial idempotente.
- JWT consulta cuenta, estado y rol vigente en PostgreSQL.
- BOLA usa relaciones reales e IDs sin redondear BIGINT.
- Restricciones FK, índices de unicidad y reserva de agenda.
- Transiciones de citas validadas de forma atómica.
- Scripts de esquema, seguridad y verificación en `database/`.
- Pruebas separadas de la implementación antigua en memoria.

## Estado y validación

El backend y la base Supabase están configurados en el entorno local. `npm test`, `npm run db:check`, y en el frontend `npm run lint` y `npm run build` son los comandos de validación. Las pruebas de integración HTTP y PostgreSQL requieren las variables locales y se reportan por separado cuando no están habilitadas.

Las fuentes históricas `src/data/` se conservan para referencia; los servicios de negocio ya no las consultan. API Keys continúan configuradas mediante variables de entorno. Los README_BLOQUE del hospital se conservan como material del insumo; sus estados reportados no certifican este entorno.

## Bloques 7.5.1 y 8

El primer administrador se crea mediante un proceso explícito y separado del arranque HTTP:

```bash
npm run seed:admin
```

`npm start` y `npm run dev` solo inician la API y no crean ni modifican usuarios. Las variables `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` son temporales, deben suministrarse únicamente durante la inicialización y retirarse después.

Documentación de ejecución y validación:

- [Bloque 7.5.1 - bootstrap administrativo](README_BLOQUE_7_5_1_BOOTSTRAP_ADMIN.md)
- [Laboratorio 8 - validación integral](README_BLOQUE_8.md)

Pruebas automatizadas:

```bash
npm test
npm run test:bootstrap
```

## Guías por componente

- Backend / API: [backend/README.md](backend/README.md)
- Base de datos: [database/README.md](database/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

## Frontend

La interfaz React está en `frontend/`. Configura `PORT=3001` y `ALLOWED_ORIGIN=http://localhost:5174` en el `.env` local del backend. En otra terminal ejecuta `cd frontend`, `npm ci` y `npm run dev`; la interfaz estará en `http://localhost:5174`. Para compilar y revisar: `npm run lint` y `npm run build`.

El navegador usa el token JWT de la sesión y no recibe API Keys privadas. Los clientes de integración que no son navegador siguen autenticándose con API Key.
