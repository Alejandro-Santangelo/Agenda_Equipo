-- ============================================
-- BUSCAR EMAILS @equipo.com EN TODAS LAS TABLAS
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para encontrar TODAS las referencias a emails demo

-- 1. TEAM_MEMBERS
SELECT 'team_members' as tabla, id, email, name, role
FROM public.team_members 
WHERE email LIKE '%@equipo.com';

-- 2. PROFILES (comentado - no existe en tu schema)
-- SELECT 'profiles' as tabla, id, email, name, role
-- FROM public.profiles 
-- WHERE email LIKE '%@equipo.com';

-- 3. EVENTS (creador)
SELECT 'events' as tabla, id, title, created_by
FROM public.events 
WHERE created_by IN (SELECT id FROM public.team_members WHERE email LIKE '%@equipo.com');

-- 4. TASKS (creador o asignado)
SELECT 'tasks' as tabla, id, title, created_by, assigned_to
FROM public.tasks 
WHERE created_by IN (SELECT id FROM public.team_members WHERE email LIKE '%@equipo.com')
   OR assigned_to IN (SELECT id FROM public.team_members WHERE email LIKE '%@equipo.com');

-- 5. PROJECTS (creador)
SELECT 'projects' as tabla, id, name, created_by
FROM public.projects 
WHERE created_by IN (SELECT id FROM public.team_members WHERE email LIKE '%@equipo.com');

-- 6. SHARED_FILES (comentado - columnas no coinciden)
-- SELECT 'shared_files' as tabla, id, name
-- FROM public.shared_files;

-- 7. CHAT_MESSAGES (comentado - columnas no coinciden)
-- SELECT 'chat_messages' as tabla, id, message
-- FROM public.chat_messages;

-- 8. NOTIFICATIONS (comentado - columnas no coinciden)
-- SELECT 'notifications' as tabla, id, message
-- FROM public.notifications;

-- 9. ACTIVITY_LOG (comentado - columnas no coinciden)
-- SELECT 'activity_log' as tabla, id, action
-- FROM public.activity_log;

-- 10. AUTH.USERS (comentado - requiere permisos especiales)
-- SELECT 'auth.users' as tabla, id, email
-- FROM auth.users 
-- WHERE email LIKE '%@equipo.com';

-- ============================================
-- RESULTADO: Las únicas tablas que importan son:
-- 1. team_members (usuarios demo)
-- 2. events (creados por usuarios demo)
-- 3. tasks (creadas/asignadas a usuarios demo)
-- 4. projects (creados por usuarios demo)
-- ============================================
