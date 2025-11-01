-- ========================================
-- ESQUEMA EXPANDIDO PARA TODAS LAS FUNCIONALIDADES
-- Sistema Colaborativo de Equipo - Paula, Gabi, Caro
-- ========================================

-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. PROYECTOS (Agrupación de tareas)
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- Color para identificación visual
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- ========================================
-- 2. TAREAS (Sistema completo de gestión)
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Asignación y responsabilidades
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Fechas y tiempo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadatos
  estimated_hours INTEGER,
  actual_hours INTEGER,
  tags TEXT[], -- Para categorización flexible
  
  -- Para vista Kanban
  position INTEGER DEFAULT 0 -- Orden dentro de su columna
);

-- ========================================
-- 3. COMENTARIOS EN TAREAS
-- ========================================
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. CALENDARIO Y EVENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Fechas y duración
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  -- Organización
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'personal', 'team')),
  
  -- Configuración
  recurrence TEXT, -- 'daily', 'weekly', 'monthly', etc.
  location TEXT,
  online_meeting_link TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. PARTICIPANTES DE EVENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- ========================================
-- 6. NOTAS COLABORATIVAS
-- ========================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB, -- Para rich text con formato
  
  -- Organización
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Configuración
  is_public BOOLEAN DEFAULT TRUE, -- Visible para todo el equipo
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 7. HISTORIAL DE CAMBIOS EN NOTAS
-- ========================================
CREATE TABLE IF NOT EXISTS note_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 8. SISTEMA DE NOTIFICACIONES
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'task_assigned', 'task_completed', 'task_due', 
    'event_reminder', 'event_invitation',
    'file_shared', 'chat_mention',
    'project_update', 'system'
  )),
  
  -- Referencias opcionales
  related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  related_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Estado
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 9. REPORTES Y ESTADÍSTICAS
-- ========================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'task_created', 'file_uploaded', 'login', etc.
  entity_type TEXT, -- 'task', 'project', 'file', 'note'
  entity_id UUID,
  details JSONB, -- Datos adicionales flexibles
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 10. CONFIGURACIONES DE USUARIO
-- ========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notificaciones
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  whatsapp_notifications BOOLEAN DEFAULT FALSE,
  
  -- Interfaz
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  timezone TEXT DEFAULT 'America/Mexico_City',
  
  -- Productividad
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '17:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Tareas
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Eventos
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Actividad
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS DE SEGURIDAD
-- ========================================

-- PROYECTOS: Todos los miembros pueden ver, solo creador y admin pueden modificar
CREATE POLICY "Everyone can view projects" ON projects FOR SELECT USING (TRUE);
CREATE POLICY "Creator and admin can modify projects" ON projects FOR ALL USING (
  created_by = auth.uid()::uuid OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- TAREAS: Visibles para todos, modificables por asignado, creador o admin
CREATE POLICY "Everyone can view tasks" ON tasks FOR SELECT USING (TRUE);
CREATE POLICY "Assigned user, creator and admin can modify tasks" ON tasks FOR ALL USING (
  assigned_to = auth.uid()::uuid OR 
  created_by = auth.uid()::uuid OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- COMENTARIOS: Visibles para todos, solo creador puede modificar
CREATE POLICY "Everyone can view task comments" ON task_comments FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own comments" ON task_comments FOR ALL USING (user_id = auth.uid()::uuid);

-- EVENTOS: Visibles para todos los miembros
CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (TRUE);
CREATE POLICY "Creator and admin can modify events" ON events FOR ALL USING (
  created_by = auth.uid()::uuid OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- PARTICIPANTES DE EVENTOS
CREATE POLICY "Everyone can view event participants" ON event_participants FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own participation" ON event_participants FOR ALL USING (
  user_id = auth.uid()::uuid OR 
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid()::uuid) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- NOTAS: Públicas visibles para todos, privadas solo para creador
CREATE POLICY "Public notes visible to all" ON notes FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Private notes visible to creator" ON notes FOR SELECT USING (created_by = auth.uid()::uuid);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (created_by = auth.uid()::uuid);

-- NOTIFICACIONES: Solo el destinatario puede ver sus notificaciones
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid()::uuid);

-- PREFERENCIAS: Solo el usuario puede ver y modificar las suyas
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (user_id = auth.uid()::uuid);

-- LOGS DE ACTIVIDAD: Solo admins pueden ver todos, usuarios solo los suyos
CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (
  user_id = auth.uid()::uuid OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Crear proyecto por defecto
INSERT INTO projects (name, description, created_by, color) 
SELECT 'Tareas Generales', 'Proyecto por defecto para tareas sin categorizar', id, '#6366F1'
FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- Crear preferencias por defecto para usuarios existentes
INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Función para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', (SELECT COUNT(*) FROM tasks WHERE assigned_to = user_uuid),
    'completed_tasks', (SELECT COUNT(*) FROM tasks WHERE assigned_to = user_uuid AND status = 'completed'),
    'pending_tasks', (SELECT COUNT(*) FROM tasks WHERE assigned_to = user_uuid AND status = 'pending'),
    'overdue_tasks', (SELECT COUNT(*) FROM tasks WHERE assigned_to = user_uuid AND due_date < NOW() AND status != 'completed'),
    'total_projects', (SELECT COUNT(*) FROM projects WHERE created_by = user_uuid),
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND is_read = FALSE)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = user_uuid AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

-- Este esquema está diseñado para soportar:
-- ✅ Sistema de Tareas completo con asignación y seguimiento
-- ✅ Calendario compartido con eventos y recordatorios  
-- ✅ Notas colaborativas con historial de cambios
-- ✅ Sistema de notificaciones en tiempo real
-- ✅ Dashboard de productividad y estadísticas
-- ✅ Reportes automáticos y logs de actividad
-- ✅ Configuraciones personalizables por usuario
-- ✅ Seguridad robusta con RLS y políticas granulares
-- ✅ Escalabilidad para funcionalidades futuras

COMMENT ON TABLE projects IS 'Proyectos para agrupar tareas y organizar el trabajo del equipo';
COMMENT ON TABLE tasks IS 'Sistema completo de gestión de tareas con asignación y seguimiento';
COMMENT ON TABLE events IS 'Calendario compartido para coordinación del equipo';
COMMENT ON TABLE notifications IS 'Sistema de notificaciones en tiempo real';
COMMENT ON TABLE notes IS 'Notas colaborativas con control de versiones';
COMMENT ON TABLE activity_logs IS 'Registro de actividades para reportes y estadísticas';
COMMENT ON TABLE user_preferences IS 'Configuraciones personalizables por usuario';