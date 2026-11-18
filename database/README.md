# Base de datos — VeterinariaSegura

La API veterinaria usa PostgreSQL/Supabase. Los scripts son incrementales y corresponden al esquema actual del proyecto. No ejecutes sobre una base existente sin revisar primero su estado.

## Instalación en una base nueva

Ejecuta desde SQL Editor, en este orden:

1. `01_esquema_veterinaria.sql` crea las seis tablas base.
2. `02_roles_seguridad.sql` inserta los roles, habilita RLS y revoca el acceso directo de `anon` y `authenticated`.
3. `04_recuperacion_password.sql` agrega `version_sesion`, códigos de respaldo y tokens administrativos, también con RLS.
4. `03_verificacion.sql` comprueba las seis tablas base, roles, relaciones y permisos.
5. `05_verificacion_recuperacion.sql` comprueba las dos tablas de recuperación.

El resultado final contiene **8 tablas** en `public`: seis tablas base y `codigos_recuperacion` y `password_reset_tokens`. El esquema base contiene 7 claves foráneas y las tablas de recuperación agregan 3. Las verificaciones se ejecutan al final para reflejar todos los objetos.

`01_esquema_veterinaria.sql` es solo para una base nueva. `02_roles_seguridad.sql` también se ejecuta una vez porque inserta roles sin duplicarlos. Para una instalación existente, compara primero columnas, restricciones e índices; no borres tablas ni ejecutes los scripts a ciegas.

Para URI, TLS, arranque del backend y evidencias, consulta [GUIA_SUPABASE.md](../GUIA_SUPABASE.md).
