-- Script para limpiar archivos temporales y el historial completo de archivos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver qué actividades de archivos hay (antes de eliminar)
SELECT 
  id,
  entity_type,
  entity_id,
  entity_name,
  action_type,
  created_at
FROM activity_log
WHERE entity_type = 'file'
ORDER BY created_at DESC;

-- 2. Eliminar TODAS las actividades relacionadas con archivos
DELETE FROM activity_log
WHERE entity_type = 'file';

-- 3. Ver los archivos en shared_files
SELECT * FROM shared_files;

-- 4. (OPCIONAL) Si quieres eliminar también todos los archivos de shared_files:
-- DELETE FROM shared_files;

-- 5. Verificar que se eliminó todo
SELECT COUNT(*) as total_actividades_archivo
FROM activity_log
WHERE entity_type = 'file';

SELECT COUNT(*) as total_archivos
FROM shared_files;
