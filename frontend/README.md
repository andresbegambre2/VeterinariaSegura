# Frontend Veterinaria Segura

SPA de React 19, Vite 8, React Router y Bootstrap conectada a VeterinariaSegura. Incluye inicio y recuperación de sesión, panel según rol y vistas de usuarios, propietarios, mascotas, veterinarios y citas.

## Inicio

1. Asegúrate de que el backend esté activo en `http://localhost:3001` y tenga `ALLOWED_ORIGIN=http://localhost:5174`.
2. Copia `.env.example` a `.env.local` si quieres cambiar `VITE_API_URL` (por defecto usa `http://localhost:3001`).
3. Desde esta carpeta ejecuta `npm ci`, `npm run lint`, `npm run build` y `npm run dev`.
4. Abre `http://localhost:5174`. Vite fija este puerto para que Hospital pueda ejecutarse al mismo tiempo.

El navegador no contiene API Keys privadas. Las operaciones de recursos usan el JWT de la sesión; el backend valida rol y propiedad en cada ruta. Las API Keys permanecen para integraciones no navegador.
