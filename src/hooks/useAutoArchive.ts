'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

/**
 * Hook para archivar automáticamente eventos y tareas pasados al historial
 */
export function useAutoArchive() {
  const { currentUser } = useAuth()

  const archivePastItems = useCallback(async () => {
    if (!supabase || !currentUser) return

    try {
      const now = new Date()
      
      // 1. Buscar eventos pasados que no estén archivados
      const { data: pastEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .lt('end_date', now.toISOString())
        .is('archived_at', null)

      if (eventsError) {
        console.error('Error fetching past events:', eventsError)
      }

      // 2. Buscar tareas completadas o vencidas que no estén archivadas
      const { data: pastTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(`status.eq.completed,and(due_date.lt.${now.toISOString()},status.neq.completed)`)
        .is('archived_at', null)

      if (tasksError) {
        console.error('Error fetching past tasks:', tasksError)
      }

      // 3. Archivar eventos pasados
      if (pastEvents && pastEvents.length > 0) {
        for (const event of pastEvents) {
          // Registrar en el historial
          await supabase.from('activity_log').insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'archive',
            entity_type: 'event',
            entity_id: event.id,
            entity_name: event.title,
            details: `Evento archivado automáticamente (fecha: ${new Date(event.end_date).toLocaleDateString()})`,
            metadata: {
              archived_reason: 'auto_past_date',
              original_end_date: event.end_date,
              event_type: event.event_type
            }
          })

          // Marcar como archivado
          await supabase
            .from('events')
            .update({ archived_at: now.toISOString() })
            .eq('id', event.id)
        }
        
        console.log(`✅ ${pastEvents.length} eventos archivados automáticamente`)
      }

      // 4. Archivar tareas pasadas
      if (pastTasks && pastTasks.length > 0) {
        for (const task of pastTasks) {
          const isCompleted = task.status === 'completed'
          const reason = isCompleted ? 'completed' : 'auto_past_due_date'
          
          // Registrar en el historial
          await supabase.from('activity_log').insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'archive',
            entity_type: 'task',
            entity_id: task.id,
            entity_name: task.title,
            details: isCompleted 
              ? `Tarea completada y archivada`
              : `Tarea archivada automáticamente (vencida el ${new Date(task.due_date).toLocaleDateString()})`,
            metadata: {
              archived_reason: reason,
              original_due_date: task.due_date,
              status: task.status,
              priority: task.priority
            }
          })

          // Marcar como archivada
          await supabase
            .from('tasks')
            .update({ archived_at: now.toISOString() })
            .eq('id', task.id)
        }
        
        console.log(`✅ ${pastTasks.length} tareas archivadas automáticamente`)
      }

    } catch (error) {
      console.error('Error archiving past items:', error)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    // Ejecutar al montar el componente
    archivePastItems()

    // Ejecutar cada hora (3600000 ms)
    const interval = setInterval(() => {
      archivePastItems()
    }, 3600000)

    return () => clearInterval(interval)
  }, [currentUser, archivePastItems])

  return { archivePastItems }
}
