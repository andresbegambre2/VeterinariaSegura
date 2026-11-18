# Backend — VeterinariaSegura

API REST en Express. El código del servidor está en `src/`; esta guía describe cómo instalarlo y ejecutarlo desde la carpeta raíz del repositorio.

## Requisitos y configuración

- Node.js LTS y npm.
- Una base PostgreSQL/Supabase configurada siguiendo [database/README.md](../database/README.md) y [GUIA_SUPABASE.md](../GUIA_SUPABASE.md).
- Archivo `.env` local en la raíz. Define `PORT=3001`, `ALLOWED_ORIGIN=http://localhost:5174` y las variables de conexión, JWT y API Key indicadas en `.env.example`. No publiques el `.env` ni compartas secretos.

## Instalar, verificar y ejecutar

Desde la raíz `VeterinariaSegura/`:

```bash
npm ci
npm run db:check
npm test
npm start
```

La documentación de API está en `http://localhost:3001/api-docs` y el contrato OpenAPI en `http://localhost:3001/openapi.json`. El frontend se ejecuta aparte; sigue [frontend/README.md](../frontend/README.md).

Para desarrollar con recarga automática usa `npm run dev`. Para inicializar el primer administrador sigue las instrucciones de [README_BLOQUE_7_5_1_BOOTSTRAP_ADMIN.md](../README_BLOQUE_7_5_1_BOOTSTRAP_ADMIN.md); no pongas credenciales en el repositorio.
