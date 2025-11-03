-- Eliminar usuarios demo de producción
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar paula@equipo.com de team_members
DELETE FROM public.team_members 
WHERE email = 'paula@equipo.com';

-- 2. Eliminar paula@equipo.com de auth.users (si existe)
DELETE FROM auth.users 
WHERE email = 'paula@equipo.com';

-- 3. Verificar que solo quedan Gabi y Caro (se eliminarán automáticamente cuando actualicen sus perfiles)
SELECT email, name, role, created_at 
FROM public.team_members 
WHERE email LIKE '%@equipo.com'
ORDER BY created_at DESC;

-- Resultado esperado: Solo gabi@equipo.com y caro@equipo.com
