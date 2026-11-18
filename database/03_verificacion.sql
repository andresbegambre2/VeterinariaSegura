SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('roles','usuarios','propietarios','veterinarios','mascotas','citas') ORDER BY table_name;
SELECT id,nombre,activo FROM public.roles ORDER BY id;
SELECT relname AS tabla,relrowsecurity AS rls_habilitado FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN ('roles','usuarios','propietarios','veterinarios','mascotas','citas') ORDER BY relname;
SELECT conrelid::regclass AS tabla,conname,confrelid::regclass AS referencia FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace ORDER BY tabla,conname;
SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('roles','usuarios','propietarios','veterinarios','mascotas','citas');
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('roles','usuarios','propietarios','veterinarios','mascotas','citas') AND grantee IN ('anon','authenticated');
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('roles','usuarios','propietarios','veterinarios','mascotas','citas') ORDER BY tablename,indexname;
