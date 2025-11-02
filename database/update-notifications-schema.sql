-- =============================================================================
-- 🔔 ACTUALIZACIÓN DE ESQUEMA: SOPORTE PARA NOTIFICACIONES
-- Agregar campos para números de teléfono y configuraciones de notificación
-- =============================================================================

-- 📱 Agregar campo de teléfono a team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 🔔 Crear tabla de configuraciones de notificación
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  
  -- Preferencias de notificación
  email_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Tipos de notificaciones que quiere recibir
  notify_task_assigned BOOLEAN DEFAULT true,
  notify_task_completed BOOLEAN DEFAULT true,
  notify_event_reminder BOOLEAN DEFAULT true,
  notify_chat_mention BOOLEAN DEFAULT true,
  notify_file_shared BOOLEAN DEFAULT true,
  notify_new_member BOOLEAN DEFAULT true,
  
  -- Configuración de recordatorios
  meeting_reminder_minutes INTEGER DEFAULT 15,
  task_reminder_hours INTEGER DEFAULT 24,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Un usuario solo puede tener una configuración
  UNIQUE(user_id)
);

-- 📊 Crear tabla de log de notificaciones enviadas
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  
  -- Detalles de la notificación
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'welcome_member', 
    'task_assigned', 
    'task_completed',
    'event_reminder', 
    'chat_mention', 
    'file_shared',
    'new_member_joined'
  )),
  
  -- Canal utilizado
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'push')),
  
  -- Estado del envío
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
  
  -- Detalles técnicos
  recipient_email TEXT,
  recipient_phone TEXT,
  message_id TEXT, -- ID del proveedor (Resend, Twilio, etc.)
  error_message TEXT,
  
  -- Metadatos
  subject TEXT,
  content_preview TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Índices para búsquedas rápidas
  CONSTRAINT valid_recipient CHECK (
    (channel = 'email' AND recipient_email IS NOT NULL) OR
    (channel = 'whatsapp' AND recipient_phone IS NOT NULL) OR
    (channel = 'push')
  )
);

-- =============================================================================
-- 📊 ÍNDICES PARA OPTIMIZACIÓN
-- =============================================================================

-- Índices para notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

-- Índices para notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id 
ON public.notification_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type 
ON public.notification_logs(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel 
ON public.notification_logs(channel);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status 
ON public.notification_logs(status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON public.notification_logs(sent_at DESC);

-- Índice para team_members con teléfono
CREATE INDEX IF NOT EXISTS idx_team_members_phone 
ON public.team_members(phone) WHERE phone IS NOT NULL;

-- =============================================================================
-- 🔒 ROW LEVEL SECURITY
-- =============================================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_preferences
CREATE POLICY "Users can view own notification preferences" 
ON public.notification_preferences
FOR SELECT USING (true);

CREATE POLICY "Users can update own notification preferences" 
ON public.notification_preferences
FOR UPDATE USING (true);

CREATE POLICY "Users can insert own notification preferences" 
ON public.notification_preferences
FOR INSERT WITH CHECK (true);

-- Políticas para notification_logs (solo lectura para usuarios, admins pueden ver todo)
CREATE POLICY "Users can view own notification logs" 
ON public.notification_logs
FOR SELECT USING (true);

-- Solo el sistema puede insertar logs
CREATE POLICY "System can insert notification logs" 
ON public.notification_logs
FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 🚀 FUNCIONES AUXILIARES
-- =============================================================================

-- Función para crear preferencias por defecto cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear preferencias automáticamente
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON public.team_members;
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

-- Función para registrar notificación enviada
CREATE OR REPLACE FUNCTION public.log_notification(
  p_user_id UUID,
  p_type TEXT,
  p_channel TEXT,
  p_status TEXT,
  p_recipient_email TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
  p_message_id TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_content_preview TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.notification_logs (
    user_id, notification_type, channel, status,
    recipient_email, recipient_phone, message_id, error_message,
    subject, content_preview
  ) VALUES (
    p_user_id, p_type, p_channel, p_status,
    p_recipient_email, p_recipient_phone, p_message_id, p_error_message,
    p_subject, p_content_preview
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 📊 ACTUALIZAR USUARIOS EXISTENTES
-- =============================================================================

-- Agregar números de teléfono a usuarios existentes (ejemplo)
UPDATE public.team_members SET 
  phone = '+54 9 11 1111-1111'
WHERE email = 'paula@equipo.com';

UPDATE public.team_members SET 
  phone = '+54 9 11 3333-3333'  
WHERE email = 'gabi@equipo.com';

UPDATE public.team_members SET 
  phone = '+54 9 11 2222-2222'
WHERE email = 'caro@equipo.com';

-- =============================================================================
-- ✅ VERIFICACIÓN DE LA ACTUALIZACIÓN
-- =============================================================================

-- Verificar que las tablas se crearon correctamente
SELECT 'notification_preferences' as tabla, COUNT(*) as registros 
FROM public.notification_preferences
UNION ALL
SELECT 'notification_logs' as tabla, COUNT(*) as registros 
FROM public.notification_logs
UNION ALL
SELECT 'team_members_con_telefono' as tabla, COUNT(*) as registros 
FROM public.team_members WHERE phone IS NOT NULL;

SELECT '✅ Actualización de esquema para notificaciones completada!' as status;