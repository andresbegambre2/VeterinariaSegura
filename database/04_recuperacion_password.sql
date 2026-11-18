BEGIN;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_usuarios_version_sesion'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT ck_usuarios_version_sesion
      CHECK (version_sesion >= 1);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.codigos_recuperacion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  codigo_hash VARCHAR(64) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_uso TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  administrador_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  fecha_uso TIMESTAMPTZ,
  CONSTRAINT ck_password_reset_expiracion
    CHECK (fecha_expiracion > fecha_creacion)
);

CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario
  ON public.codigos_recuperacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_usuario
  ON public.password_reset_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiracion
  ON public.password_reset_tokens(fecha_expiracion)
  WHERE fecha_uso IS NULL;

ALTER TABLE public.codigos_recuperacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.codigos_recuperacion,
  public.password_reset_tokens
FROM anon, authenticated;

COMMIT;
