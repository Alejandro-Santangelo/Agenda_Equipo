# 🗂️ Instrucciones para Activar el Sistema de Archivo Automático

## ✅ Cambios Implementados

El sistema ahora archiva automáticamente:
- **Eventos** cuya `end_date` ya pasó
- **Tareas completadas** 
- **Tareas vencidas** que no fueron completadas

## 📋 Paso 1: Ejecutar Migración SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y ejecuta este SQL:

```sql
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
```

4. Haz clic en **Run** o presiona `Ctrl+Enter`

## 🔄 Cómo Funciona

### Verificación Automática
- Se ejecuta **al cargar la aplicación**
- Se ejecuta **cada hora** mientras la app esté abierta

### Lógica de Archivado

**Para Eventos:**
- Si `end_date < fecha actual` → Se archiva automáticamente

**Para Tareas:**
- Si `status = 'completed'` → Se archiva
- Si `due_date < fecha actual` Y `status ≠ 'completed'` → Se archiva (tarea vencida)

### Registro en Historial
Cada archivado automático:
- ✅ Se registra en `activity_log`
- ✅ Incluye razón del archivo (`auto_past_date`, `completed`, `auto_past_due_date`)
- ✅ Guarda metadatos (fecha original, tipo, estado, etc.)

## 🔍 Consultas Útiles

### Ver eventos archivados
```sql
SELECT * FROM events WHERE archived_at IS NOT NULL ORDER BY archived_at DESC;
```

### Ver tareas archivadas
```sql
SELECT * FROM tasks WHERE archived_at IS NOT NULL ORDER BY archived_at DESC;
```

### Ver log de archivados automáticos
```sql
SELECT * FROM activity_log WHERE action_type = 'archive' ORDER BY created_at DESC;
```

### Restaurar un evento archivado
```sql
UPDATE events SET archived_at = NULL WHERE id = 'ID_DEL_EVENTO';
```

### Restaurar una tarea archivada
```sql
UPDATE tasks SET archived_at = NULL WHERE id = 'ID_DE_LA_TAREA';
```

## 📱 Interfaz de Usuario

- Los eventos/tareas archivados **NO aparecen** en las vistas principales
- Se pueden ver en el **Historial** (botón "Historial" en cada sección)
- El historial muestra:
  - Cuándo se archivó
  - Razón del archivado
  - Datos originales del evento/tarea

## 🧪 Probar el Sistema

1. Crea un evento con fecha pasada
2. Espera unos segundos o recarga la app
3. El evento desaparecerá de la lista principal
4. Aparecerá en el **Historial** con la acción "archive"

## ⚙️ Configuración

El intervalo de verificación se puede ajustar en `src/hooks/useAutoArchive.ts`:

```typescript
// Actualmente: cada 1 hora (3600000 ms)
const interval = setInterval(() => {
  archivePastItems()
}, 3600000)

// Para cambiar a cada 30 minutos:
}, 1800000)

// Para cambiar a cada 24 horas:
}, 86400000)
```

## 🚀 Deployment

Los cambios ya están pusheados a GitHub y se desplegarán automáticamente en Vercel.

**IMPORTANTE:** No olvides ejecutar la migración SQL en Supabase antes de usar el sistema.
