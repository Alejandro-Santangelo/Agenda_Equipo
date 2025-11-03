-- =============================================================================
-- TABLA DE HISTORIAL DE ACTIVIDADES
-- =============================================================================
-- Esta tabla registra todas las acciones realizadas por los usuarios en la app

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  
  -- Tipo de acción: create, update, delete, upload, share, send, etc.
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create', 'update', 'delete', 'upload', 'download', 'share', 
    'send', 'edit', 'complete', 'assign', 'comment'
  )),
  
  -- Entidad afectada: task, event, file, message, project, etc.
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'task', 'event', 'file', 'message', 'project', 'user', 'comment'
  )),
  
  -- ID de la entidad afectada
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  
  -- Descripción de la actividad
  description TEXT NOT NULL,
  
  -- Metadatos adicionales (JSON)
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON public.activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON public.activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);

-- Habilitar RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "activity_log_select_policy" ON public.activity_log;
CREATE POLICY "activity_log_select_policy" ON public.activity_log
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "activity_log_insert_policy" ON public.activity_log;
CREATE POLICY "activity_log_insert_policy" ON public.activity_log
  FOR INSERT WITH CHECK (true);

-- Vista para estadísticas de actividad
CREATE OR REPLACE VIEW public.activity_stats AS
SELECT 
  entity_type,
  action_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM public.activity_log
GROUP BY entity_type, action_type, DATE(created_at)
ORDER BY date DESC, count DESC;

-- Comentarios
COMMENT ON TABLE public.activity_log IS 'Registro completo de todas las actividades realizadas en la aplicación';
COMMENT ON COLUMN public.activity_log.action_type IS 'Tipo de acción realizada';
COMMENT ON COLUMN public.activity_log.entity_type IS 'Tipo de entidad afectada';
COMMENT ON COLUMN public.activity_log.metadata IS 'Información adicional en formato JSON';
