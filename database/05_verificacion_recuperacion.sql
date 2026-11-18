SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name = 'version_sesion';

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('codigos_recuperacion', 'password_reset_tokens')
ORDER BY tablename;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('codigos_recuperacion', 'password_reset_tokens')
ORDER BY tablename, indexname;

SELECT
  (SELECT COUNT(*) FROM public.codigos_recuperacion) AS codigos_registrados,
  (SELECT COUNT(*) FROM public.password_reset_tokens) AS tokens_registrados;
