-- =============================================================================
-- 🗃️ SCRIPT SQL COMPLETO PARA SUPABASE - TODAS LAS FUNCIONALIDADES
-- Agenda Colaborativa del Equipo - Paula, Gabi, Caro
-- =============================================================================
-- 
-- Este script crea TODAS las tablas necesarias para:
-- ✅ Autenticación y perfiles de usuarios
-- ✅ Chat y mensajes
-- ✅ Archivos compartidos
-- ✅ Tareas y proyectos
-- ✅ Eventos y calendario
-- 
-- Ejecutar este script completo en el SQL Editor de Supabase
-- =============================================================================

-- ✨ EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 📋 TABLA 1: TEAM_MEMBERS (Usuarios del equipo)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_name CHECK (length(name) >= 2 AND length(name) <= 50)
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active);

-- =============================================================================
-- 📁 TABLA 2: SHARED_FILES (Archivos compartidos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upload', 'link')),
  file_type TEXT,
  url TEXT,
  size_bytes BIGINT,
  shared_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT,
  tags TEXT[],
  download_count INTEGER DEFAULT 0,
  
  CONSTRAINT valid_file_name CHECK (length(name) >= 1 AND length(name) <= 255),
  CONSTRAINT valid_url_when_link CHECK (
    (type = 'link' AND url IS NOT NULL AND url != '') OR 
    (type = 'upload')
  ),
  CONSTRAINT valid_size CHECK (size_bytes IS NULL OR size_bytes > 0)
);

CREATE INDEX IF NOT EXISTS idx_shared_files_created_at ON public.shared_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_files_shared_by ON public.shared_files(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_files_type ON public.shared_files(type);

-- =============================================================================
-- 💬 TABLA 3: CHAT_MESSAGES (Mensajes del chat)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_message CHECK (length(message) >= 1 AND length(message) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_by ON public.chat_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to);

-- =============================================================================
-- 📊 TABLA 4: PROJECTS (Proyectos para agrupar tareas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- =============================================================================
-- ✅ TABLA 5: TASKS (Tareas del equipo)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  created_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  estimated_hours INTEGER,
  actual_hours INTEGER,
  tags TEXT[],
  position INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- =============================================================================
-- 📅 TABLA 6: EVENTS (Eventos del calendario)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  created_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'personal')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  recurrence TEXT,
  location TEXT,
  online_meeting_link TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);

-- =============================================================================
-- 👥 TABLA 7: EVENT_PARTICIPANTS (Participantes de eventos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON public.event_participants(user_id);

-- =============================================================================
-- 🔒 CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 📋 POLÍTICAS DE SEGURIDAD
-- =============================================================================

-- TEAM_MEMBERS: Todos pueden ver miembros activos
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;
CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;
CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (true);

-- SHARED_FILES: Todos los miembros pueden ver y gestionar archivos
DROP POLICY IF EXISTS "shared_files_select_policy" ON public.shared_files;
CREATE POLICY "shared_files_select_policy" ON public.shared_files
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "shared_files_insert_policy" ON public.shared_files;
CREATE POLICY "shared_files_insert_policy" ON public.shared_files
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "shared_files_update_policy" ON public.shared_files;
CREATE POLICY "shared_files_update_policy" ON public.shared_files
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "shared_files_delete_policy" ON public.shared_files;
CREATE POLICY "shared_files_delete_policy" ON public.shared_files
  FOR DELETE USING (true);

-- CHAT_MESSAGES: Todos pueden ver y enviar mensajes
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "chat_messages_delete_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
  FOR DELETE USING (true);

-- PROJECTS: Todos pueden ver y crear proyectos
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE USING (true);

-- TASKS: Todos pueden ver y gestionar tareas
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
CREATE POLICY "tasks_select_policy" ON public.tasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
CREATE POLICY "tasks_insert_policy" ON public.tasks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
CREATE POLICY "tasks_update_policy" ON public.tasks
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
CREATE POLICY "tasks_delete_policy" ON public.tasks
  FOR DELETE USING (true);

-- EVENTS: Todos pueden ver y gestionar eventos
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_update_policy" ON public.events;
CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (true);

-- EVENT_PARTICIPANTS: Todos pueden ver y gestionar participación
DROP POLICY IF EXISTS "event_participants_select_policy" ON public.event_participants;
CREATE POLICY "event_participants_select_policy" ON public.event_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "event_participants_insert_policy" ON public.event_participants;
CREATE POLICY "event_participants_insert_policy" ON public.event_participants
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "event_participants_update_policy" ON public.event_participants;
CREATE POLICY "event_participants_update_policy" ON public.event_participants
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "event_participants_delete_policy" ON public.event_participants;
CREATE POLICY "event_participants_delete_policy" ON public.event_participants
  FOR DELETE USING (true);

-- =============================================================================
-- 👥 INSERTAR DATOS INICIALES DEL EQUIPO
-- =============================================================================

-- Paula (Admin) - Contraseña: 1111
INSERT INTO public.team_members (name, email, password_hash, phone, role, avatar_url, permissions) VALUES
('Paula', 'paula@equipo.com', '$2b$12$4gL5GHOlho4KgW8zXtBt9.BAUJfFI3PIfXCF/0XOVrq6/QUNRFrJ.', '+54 9 11 1111-1111', 'admin', 
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paula',
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','files.delete_any','chat.send','chat.edit_own','chat.delete_own','chat.delete_any','chat.priority','team.view_members','team.view_activity','team.invite','team.remove','admin.manage_permissions','admin.view_stats','admin.export_data','admin.system_settings'])
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  permissions = EXCLUDED.permissions;

-- Gabi (Member) - Contraseña: 3333
INSERT INTO public.team_members (name, email, password_hash, phone, role, avatar_url, permissions) VALUES  
('Gabi', 'gabi@equipo.com', '$2b$12$OYDIK5s.ZKSn4LinNj1b8.Ng5pW5IUaYF.mkTnktuuLEQfzbjlpFq', '+54 9 11 3333-3333', 'member',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabi',
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','chat.send','chat.edit_own','chat.delete_own','team.view_members'])
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  permissions = EXCLUDED.permissions;

-- Caro (Member) - Contraseña: 2222
INSERT INTO public.team_members (name, email, password_hash, phone, role, avatar_url, permissions) VALUES
('Caro', 'caro@equipo.com', '$2b$12$b6pfm.vPiHM1d2J7j1jRkOlgR3e8oH4NGNN5PR76uUI5irLy6nFmS', '+54 9 11 2222-2222', 'member',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caro',
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','chat.send','chat.edit_own','chat.delete_own','team.view_members'])
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  permissions = EXCLUDED.permissions;

-- =============================================================================
-- 🔧 FUNCIONES AUXILIARES
-- =============================================================================

-- Actualizar timestamp de last_seen automáticamente
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.team_members 
  SET last_seen = timezone('utc'::text, now())
  WHERE id = NEW.sent_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_seen ON public.chat_messages;
CREATE TRIGGER trigger_update_last_seen
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

-- Incrementar contador de descargas
CREATE OR REPLACE FUNCTION public.increment_download_count(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_files 
  SET download_count = download_count + 1
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 📊 VISTA DE ESTADÍSTICAS
-- =============================================================================

CREATE OR REPLACE VIEW public.team_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.team_members WHERE is_active = true) as active_members,
  (SELECT COUNT(*) FROM public.shared_files) as total_files,
  (SELECT COUNT(*) FROM public.chat_messages) as total_messages,
  (SELECT COUNT(*) FROM public.tasks) as total_tasks,
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.events) as total_events,
  (SELECT COUNT(*) FROM public.tasks WHERE status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM public.shared_files WHERE created_at >= CURRENT_DATE) as files_today,
  (SELECT COUNT(*) FROM public.chat_messages WHERE created_at >= CURRENT_DATE) as messages_today;

-- =============================================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- =============================================================================

-- 🎉 ¡Tu base de datos está completamente configurada!
-- 
-- ✅ 7 Tablas creadas: team_members, shared_files, chat_messages, projects, tasks, events, event_participants
-- ✅ Índices optimizados para rendimiento
-- ✅ Row Level Security (RLS) habilitado
-- ✅ Políticas de acceso configuradas  
-- ✅ Usuarios iniciales insertados (Paula, Gabi, Caro)
-- ✅ Funciones auxiliares creadas
-- ✅ Vista de estadísticas disponible
--
-- 🚀 Ahora todos los miembros del equipo pueden:
--    - Ver y compartir archivos entre todos
--    - Enviar y recibir mensajes en tiempo real
--    - Crear y asignar tareas
--    - Programar eventos en el calendario
--    - Colaborar en proyectos
--
-- 📝 Próximos pasos:
-- 1. Verificar que las credenciales están en .env.local
-- 2. Reiniciar la aplicación: npm run dev
-- 3. ¡Empezar a colaborar!
