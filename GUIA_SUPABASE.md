# Configuración de VeterinariaSegura en Supabase

## 1. Abrir el proyecto actualizado

En VS Code abre esta carpeta:

`C:\Users\andre\Downloads\Seguridad_DEV_SW\VeterinariaSegura`

Esta es la carpeta original del proyecto, movida a Seguridad_DEV_SW. Su historial de Git y sus variables originales se conservan. No compartas `.env`. El código del insumo ya se integró y adaptó.

## 2. Crear el proyecto

1. Entra a https://supabase.com/dashboard e inicia sesión.
2. Pulsa **New project** y selecciona tu organización.
3. Nombre: **veterinariasegura**.
4. Define y guarda una contraseña única para PostgreSQL. Es distinta de la del administrador de la aplicación.
5. Elige una región cercana disponible.
6. Según las opciones disponibles del formulario: habilita Data API, desactiva la exposición automática de tablas nuevas y activa RLS automático. Los scripts también habilitan RLS y revocan permisos explícitamente.
7. Crea el proyecto y espera a que esté disponible.

Cada backend usa un proyecto Supabase diferente. No ejecutes scripts de hospital dentro de veterinaria ni a la inversa. No necesitas instalar PostgreSQL local, pagar IPv4 ni crear cuentas de pacientes o propietarios en Authentication.

## 3. Crear tablas desde SQL Editor

En el proyecto **veterinariasegura**, abre **SQL Editor → New query**. Abre cada archivo en VS Code, copia TODO su contenido, pégalo y pulsa **Run**, en este orden. Puedes guardar las consultas con el nombre del archivo:

1. `database/01_esquema_veterinaria.sql` (instalación nueva únicamente).
2. `database/02_roles_seguridad.sql` (roles iniciales y RLS).
3. `database/04_recuperacion_password.sql` (versión de sesión y tablas de recuperación).
4. `database/03_verificacion.sql`.
5. `database/05_verificacion_recuperacion.sql`.

El esquema inicial solo se ejecuta UNA vez sobre una base nueva. No borres tablas para resolver errores de conexión. Si ya existen, inspecciona primero su estructura.

La verificación debe mostrar:

- **8 tablas** de la aplicación en `public` después de la migración de recuperación.
- Tres roles: **administrador, veterinario y propietario**.
- `rls_habilitado = true` en las 8 tablas.
- **10 claves foráneas** del esquema y sus tablas de recuperación.
- Cero políticas públicas en esta etapa.
- Cero privilegios de tabla concedidos a `anon` y `authenticated`.

`03_verificacion.sql` valida las seis tablas base; `05_verificacion_recuperacion.sql` valida las dos tablas añadidas.

## 4. Obtener la conexión PostgreSQL

1. Pulsa **Connect** dentro de **veterinariasegura**.
2. Selecciona **Session pooler**. Habitualmente utiliza puerto **5432** y funciona en redes IPv4.
3. Copia la URI EXACTA que muestre Supabase. El usuario suele tener forma `postgres.REFERENCIA_DEL_PROYECTO`.
4. Sustituye `[YOUR-PASSWORD]` por tu contraseña de base de datos. Si contiene caracteres especiales, codifica la contraseña como componente de URI; no codifiques la URI entera. Los corchetes del marcador no deben quedar.
5. Abre el `.env` de ESTA carpeta y completa la línea que ya existe:

```dotenv
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres
DATABASE_CA_PATH=certs/prod-ca-2021.crt
```

Conserva las variables originales de API Keys, JWT y administrador inicial. Para la interfaz local, configura `ALLOWED_ORIGIN=http://localhost:5173`. El navegador usa JWT y no contiene una API Key privada. No pegues claves `anon`, `publishable`, `secret` o `service_role` en DATABASE_URL: se necesita una URI PostgreSQL.

## 5. Configurar TLS

1. Busca **Database → Settings → SSL configuration** (el nombre o ubicación puede variar).
2. Descarga el certificado raíz que corresponda al endpoint del proyecto.
3. Guárdalo dentro de este proyecto como `certs/prod-ca-2021.crt`. Si se descargó como `.cer`, puedes renombrarlo conservando su contenido PEM.
4. Activa **Enforce SSL on incoming connections**, si está disponible.

El código exige `rejectUnauthorized: true`. Si no existe el archivo CA, Node utiliza sus autoridades públicas de confianza. Ante un error de cadena de certificados, descarga/configura la CA correcta; no desactives la validación. El certificado de ejemplo del insumo no se carga automáticamente. Las opciones SSL de la URI se eliminan del objeto de conexión para evitar que sobrescriban esta configuración verificada.

## 6. Instalar y probar

En una terminal PowerShell de VS Code:

```powershell
cd "C:\Users\andre\Downloads\Seguridad_DEV_SW\VeterinariaSegura"
npm install
npm run db:check
```

La instalación actualiza `package-lock.json` con `pg`. Se conserva el lock anterior del proyecto; npm no pudo acceder a registry.npmjs.org durante esta sesión. Ejecuta `npm install` desde tu terminal antes de usar `npm ci`.

El script debe mostrar la base `postgres`, el usuario SQL, una fecha del servidor, los tres roles y **Conexión PostgreSQL exitosa**.

Si falla: revisa nombre de proyecto, URI de Session pooler, contraseña, estado del proyecto y certificado. No compartas la URI completa en una captura.

## 7. Arrancar la API

Comprueba que `.env` tiene `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET` y las tres API Keys. Luego ejecuta:

```powershell
npm run dev
```

El arranque verifica conectividad y crea el administrador persistente si aún no existe. Al reiniciar no debe duplicarlo. Si el mismo correo ya pertenece a una cuenta no administradora, se rechaza el bootstrap; no se le eleva el rol automáticamente.

Abre http://localhost:3000/api-docs. Si usas otro PORT, cambia la URL. Para ejecutar ambos proyectos simultáneamente, configura PORT=3000 en hospital y PORT=3001 en veterinaria; Swagger toma ese puerto de la configuración.

## 8. Crear datos y comprobar persistencia

1. En Swagger autoriza `X-API-Key` con una clave activa de tu `.env`.
2. Ejecuta `POST /api/auth/login` con ADMIN_EMAIL y ADMIN_PASSWORD.
3. Autoriza Bearer con el JWT recibido.
4. Crea un propietario, luego una mascota con su propietarioId real y un veterinario. Después crea una cita con mascotaId y veterinarioId reales.
5. Consulta el recurso creado en la API y en Table Editor.
6. Detén Node con Ctrl+C, inicia de nuevo con `npm run dev` y repite la consulta. El registro debe permanecer.

La base comienza sin los datos de demostración de los antiguos arreglos. Esos arreglos se conservan solo como referencia: no se importan automáticamente ni se usan como respaldo silencioso. Usa los IDs devueltos, no asumas que todos son 1. PostgreSQL BIGINT puede devolverse como cadena.

El registro público crea propietarios. Para probar mis-citas, vincula propietarios.usuarioId con la cuenta de rol propietario. La mascota pertenece al perfil propietario; no se vincula directamente al usuario. Para un veterinario, crea la cuenta privilegiada mediante el endpoint administrativo y asóciala al perfil veterinario.

Los estados se cambian mediante `PATCH /api/citas/:id/estado`: programada → confirmada/cancelada; confirmada → atendida/cancelada. Las citas terminales no se reabren por ese endpoint. En veterinaria, POST crea una cita programada y PUT conserva su estado; para cambiarlo usa PATCH.

## 9. Pruebas

```powershell
npm test
npm run test:db
$env:RUN_HTTP_TESTS='1'
npm run test:unit
Remove-Item Env:RUN_HTTP_TESTS
```

- `npm test`: pruebas sin conexión, más integración real omitida si no se solicita; HTTP también requiere activación explícita.
- `npm run test:db`: activa la prueba contra TU base ya configurada. Comprueba CRUD, relaciones, unicidad, RLS y visibilidad entre conexiones. Usa rollback para los datos transitorios y borra el registro aislado de persistencia al finalizar. Ejecútala en el proyecto de laboratorio, no en una base con operaciones reales.
- `RUN_HTTP_TESTS=1`: habilita la prueba HTTP con datos de prueba y acceso local; no requiere Supabase.
- `npm run test:legacy`: conserva las pruebas históricas de los laboratorios anteriores. Dependen de arreglos y reseteos en memoria; no son la verificación de la migración PostgreSQL.

Resultado de preparación: **11 pruebas aprobadas por proyecto**, **0 fallidas**. Una prueba HTTP y una de PostgreSQL real quedaron omitidas por restricciones de red/localhost y falta de Supabase configurado. No se afirma que los CRUD se hayan ejecutado contra Supabase ni que la matriz de 36 casos del insumo esté completada.

## 10. Evidencias

Guarda por separado para cada proyecto: tablas creadas; roles; RLS; FK; permisos/políticas; salida de db:check sin credenciales; login sin exponer JWT; CRUD; rechazo de acceso ajeno; conflicto de agenda; y consulta después del reinicio. Completa los resultados reales de cada bloque, sin reutilizar los estados «confirmado» del material del profesor.

JWT, API Keys, RBAC, validadores y BOLA permanecen en Express. RLS se activa sin políticas públicas y no sustituye la autorización del backend cuando la conexión PostgreSQL es privilegiada. Supabase Auth queda para una etapa posterior.
