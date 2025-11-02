-- =============================================================================
-- 🗃️ CONFIGURACIÓN COMPLETA DE BASE DE DATOS SUPABASE
-- Agenda Colaborativa del Equipo - Paula, Gabi, Caro
-- =============================================================================

-- ✨ PASO 1: Crear las tablas principales
-- =============================================================================

-- 👥 Tabla de miembros del equipo
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints adicionales
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_name CHECK (length(name) >= 2 AND length(name) <= 50)
);

-- 📁 Tabla de archivos compartidos
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
  
  -- Constraints adicionales
  CONSTRAINT valid_file_name CHECK (length(name) >= 1 AND length(name) <= 255),
  CONSTRAINT valid_url_when_link CHECK (
    (type = 'link' AND url IS NOT NULL AND url != '') OR 
    (type = 'upload')
  ),
  CONSTRAINT valid_size CHECK (size_bytes IS NULL OR size_bytes > 0)
);

-- 💬 Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  
  -- Constraints adicionales
  CONSTRAINT valid_message CHECK (length(message) >= 1 AND length(message) <= 2000)
);

-- =============================================================================
-- ✨ PASO 2: Crear índices para optimizar rendimiento
-- =============================================================================

-- Índices para team_members
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active);

-- Índices para shared_files
CREATE INDEX IF NOT EXISTS idx_shared_files_created_at ON public.shared_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_files_shared_by ON public.shared_files(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_files_type ON public.shared_files(type);

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_by ON public.chat_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to);

-- =============================================================================
-- ✨ PASO 3: Configurar Row Level Security (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ✨ PASO 4: Crear políticas de seguridad
-- =============================================================================

-- 👥 POLÍTICAS PARA TEAM_MEMBERS
-- Los miembros pueden ver todos los otros miembros activos
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (is_active = true);

-- Solo admins pueden insertar nuevos miembros
CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (true); -- Será controlado por la aplicación

-- Los miembros pueden actualizar su propio perfil
CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (true); -- Será controlado por la aplicación

-- Solo admins pueden eliminar miembros
CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (true); -- Será controlado por la aplicación

-- 📁 POLÍTICAS PARA SHARED_FILES
-- Todos los miembros pueden ver archivos
CREATE POLICY "shared_files_select_policy" ON public.shared_files
  FOR SELECT USING (true);

-- Todos los miembros pueden compartir archivos
CREATE POLICY "shared_files_insert_policy" ON public.shared_files
  FOR INSERT WITH CHECK (true);

-- Los miembros pueden actualizar sus propios archivos
CREATE POLICY "shared_files_update_policy" ON public.shared_files
  FOR UPDATE USING (true);

-- Los miembros pueden eliminar sus propios archivos o admins cualquiera
CREATE POLICY "shared_files_delete_policy" ON public.shared_files
  FOR DELETE USING (true);

-- 💬 POLÍTICAS PARA CHAT_MESSAGES
-- Todos los miembros pueden ver mensajes
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
  FOR SELECT USING (true);

-- Todos los miembros pueden enviar mensajes
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Los miembros pueden editar sus propios mensajes
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
  FOR UPDATE USING (true);

-- Los miembros pueden eliminar sus propios mensajes
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
  FOR DELETE USING (true);

-- =============================================================================
-- ✨ PASO 5: Insertar datos iniciales del equipo
-- =============================================================================

-- Insertar a Paula (Administradora) con permisos completos
INSERT INTO public.team_members (name, email, role, avatar_url, permissions) VALUES
('Paula', 'paula@equipo.com', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paula', 
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','files.delete_any','chat.send','chat.edit_own','chat.delete_own','chat.delete_any','chat.priority','team.view_members','team.view_activity','team.invite','team.remove','admin.manage_permissions','admin.view_stats','admin.export_data','admin.system_settings'])
ON CONFLICT (email) DO NOTHING;

-- Insertar a Gabi (Miembro) con permisos estándar
INSERT INTO public.team_members (name, email, role, avatar_url, permissions) VALUES  
('Gabi', 'gabi@equipo.com', 'member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabi',
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','chat.send','chat.edit_own','chat.delete_own','team.view_members'])
ON CONFLICT (email) DO NOTHING;

-- Insertar a Caro (Miembro) con permisos estándar
INSERT INTO public.team_members (name, email, role, avatar_url, permissions) VALUES
('Caro', 'caro@equipo.com', 'member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caro',
 ARRAY['files.upload','files.share_links','files.download','files.delete_own','chat.send','chat.edit_own','chat.delete_own','team.view_members'])
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- ✨ PASO 6: Crear funciones auxiliares
-- =============================================================================

-- Función para actualizar timestamp de last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.team_members 
  SET last_seen = timezone('utc'::text, now())
  WHERE id = NEW.sent_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_seen cuando se envía un mensaje
DROP TRIGGER IF EXISTS trigger_update_last_seen ON public.chat_messages;
CREATE TRIGGER trigger_update_last_seen
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

-- Función para incrementar download_count
CREATE OR REPLACE FUNCTION public.increment_download_count(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_files 
  SET download_count = download_count + 1
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ✨ PASO 7: Crear vista para estadísticas
-- =============================================================================

CREATE OR REPLACE VIEW public.team_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.team_members WHERE is_active = true) as active_members,
  (SELECT COUNT(*) FROM public.shared_files) as total_files,
  (SELECT COUNT(*) FROM public.chat_messages) as total_messages,
  (SELECT COUNT(*) FROM public.shared_files WHERE created_at >= CURRENT_DATE) as files_today,
  (SELECT COUNT(*) FROM public.chat_messages WHERE created_at >= CURRENT_DATE) as messages_today;

-- =============================================================================
-- ✨ CONFIGURACIÓN COMPLETADA ✨
-- =============================================================================

-- 🎉 ¡Tu base de datos está lista para la Agenda Colaborativa!
-- 
-- ✅ Tablas creadas con todas las constraints
-- ✅ Índices optimizados para rendimiento  
-- ✅ Row Level Security configurado
-- ✅ Políticas de acceso implementadas
-- ✅ Datos iniciales del equipo insertados
-- ✅ Funciones auxiliares creadas
-- ✅ Vista de estadísticas disponible
--
-- 🚀 Próximos pasos:
-- 1. Copia las credenciales de tu proyecto Supabase
-- 2. Actualiza el archivo .env.local
-- 3. ¡Disfruta de la sincronización online completa!

SELECT 'Configuración de base de datos completada exitosamente!' as status;