BEGIN;
CREATE TABLE public.roles (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre VARCHAR(30) NOT NULL UNIQUE CHECK (nombre IN ('administrador','veterinario','propietario')),
 descripcion VARCHAR(200), activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE public.usuarios (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
 rol_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
 nombre VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL,
 password_hash TEXT, activo BOOLEAN NOT NULL DEFAULT TRUE,
 fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 version_sesion INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX uq_usuarios_email_ci ON public.usuarios(LOWER(email));
CREATE TABLE public.propietarios (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id BIGINT UNIQUE REFERENCES public.usuarios(id) ON DELETE RESTRICT,
 nombre VARCHAR(100) NOT NULL, documento VARCHAR(30) NOT NULL UNIQUE,
 telefono VARCHAR(30) NOT NULL, correo VARCHAR(150) NOT NULL
);
CREATE UNIQUE INDEX uq_propietarios_correo_ci ON public.propietarios(LOWER(correo));
CREATE TABLE public.veterinarios (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id BIGINT UNIQUE REFERENCES public.usuarios(id) ON DELETE RESTRICT,
 nombre VARCHAR(100) NOT NULL, documento VARCHAR(30) NOT NULL UNIQUE,
 especialidad VARCHAR(100) NOT NULL, telefono VARCHAR(30) NOT NULL, correo VARCHAR(150) NOT NULL
);
CREATE UNIQUE INDEX uq_veterinarios_correo_ci ON public.veterinarios(LOWER(correo));
CREATE TABLE public.mascotas (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL, especie VARCHAR(80) NOT NULL, raza VARCHAR(80) NOT NULL,
 edad DOUBLE PRECISION NOT NULL CHECK (edad >= 0 AND edad < 'Infinity'::float8),
 propietario_id BIGINT NOT NULL REFERENCES public.propietarios(id) ON DELETE RESTRICT
);
CREATE TABLE public.citas (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 fecha DATE NOT NULL, hora TIME NOT NULL, motivo VARCHAR(200) NOT NULL CHECK (LENGTH(TRIM(motivo)) BETWEEN 3 AND 200),
 estado VARCHAR(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','confirmada','atendida','cancelada')),
 mascota_id BIGINT NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
 veterinario_id BIGINT NOT NULL REFERENCES public.veterinarios(id) ON DELETE RESTRICT
);
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol_id);
CREATE INDEX idx_mascotas_propietario ON public.mascotas(propietario_id);
CREATE INDEX idx_citas_mascota ON public.citas(mascota_id);
CREATE INDEX idx_citas_fecha ON public.citas(fecha);
CREATE UNIQUE INDEX uq_citas_veterinario_horario ON public.citas(veterinario_id,fecha,hora) WHERE estado <> 'cancelada';
COMMIT;
