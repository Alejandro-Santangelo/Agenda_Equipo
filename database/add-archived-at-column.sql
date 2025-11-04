-- Migración: Agregar columna archived_at para archivo automático
-- Fecha: 2025-11-04

-- Agregar columna archived_at a la tabla events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Agregar columna archived_at a la tabla tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Crear índices para optimizar consultas de archivado
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON public.events(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON public.tasks(archived_at) WHERE archived_at IS NOT NULL;

-- Crear índice compuesto para búsquedas de eventos no archivados por fecha
CREATE INDEX IF NOT EXISTS idx_events_not_archived_end_date ON public.events(end_date) WHERE archived_at IS NULL;

-- Crear índice compuesto para búsquedas de tareas no archivadas por fecha
CREATE INDEX IF NOT EXISTS idx_tasks_not_archived_due_date ON public.tasks(due_date) WHERE archived_at IS NULL;

-- Comentarios
COMMENT ON COLUMN public.events.archived_at IS 'Fecha y hora en que el evento fue archivado (null = activo)';
COMMENT ON COLUMN public.tasks.archived_at IS 'Fecha y hora en que la tarea fue archivada (null = activa)';
