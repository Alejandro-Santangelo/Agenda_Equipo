-- Habilitar Realtime para la tabla shared_files
-- Ejecuta esto en Supabase SQL Editor

-- 1. Habilitar publicación de Realtime en la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE shared_files;

-- 2. Verificar que está habilitado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
