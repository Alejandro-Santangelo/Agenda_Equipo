-- ============================================
-- ELIMINAR USUARIOS DEMO DE SUPABASE
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para eliminar permanentemente a Paula, Gabi y Caro

-- 1. Eliminar de team_members
DELETE FROM public.team_members 
WHERE email IN ('paula@equipo.com', 'gabi@equipo.com', 'caro@equipo.com');

-- 2. Eliminar de profiles (si existe esa tabla)
DELETE FROM public.profiles 
WHERE email IN ('paula@equipo.com', 'gabi@equipo.com', 'caro@equipo.com');

-- 3. Verificar que se eliminaron
SELECT email, name, role FROM public.team_members;

-- ✅ Después de ejecutar esto, refresca la app y solo verás usuarios reales
