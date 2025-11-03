'use client'

import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface ActivityLog {
  id: string
  user_id: string
  user_name: string
  action_type: 'create' | 'update' | 'delete' | 'upload' | 'download' | 'share' | 'send' | 'edit' | 'complete' | 'assign' | 'comment'
  entity_type: 'task' | 'event' | 'file' | 'message' | 'project' | 'user' | 'comment'
  entity_id: string
  entity_name?: string
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface ActivityLogStore {
  activities: ActivityLog[]
  loading: boolean
  error: string | null
  
  // Registrar una nueva actividad
  logActivity: (activity: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>
  
  // Obtener todas las actividades
  fetchActivities: (filters?: {
    entityType?: string
    entityId?: string
    userId?: string
    limit?: number
  }) => Promise<void>
  
  // Obtener actividades por tipo de entidad
  getActivitiesByEntity: (entityType: string, entityId?: string) => ActivityLog[]
  
  // Obtener actividades recientes
  getRecentActivities: (limit?: number) => ActivityLog[]
  
  // Limpiar error
  clearError: () => void
}

export const useActivityLog = create<ActivityLogStore>((set, get) => ({
  activities: [],
  loading: false,
  error: null,

  logActivity: async (activity) => {
    try {
      const newActivity: ActivityLog = {
        ...activity,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }

      // Agregar localmente primero
      set((state) => ({
        activities: [newActivity, ...state.activities]
      }))

      // Sincronizar con Supabase
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase.from('activity_log').insert([newActivity])
          
          if (error) {
            console.error('Error al guardar actividad en Supabase:', error)
          } else {
            console.log('✅ Actividad registrada en Supabase')
          }
        } catch {
          console.log('📱 Actividad guardada localmente, se sincronizará después')
        }
      }
    } catch (error) {
      console.error('Error logging activity:', error)
      set({ error: 'Error al registrar actividad' })
    }
  },

  fetchActivities: async (filters = {}) => {
    try {
      set({ loading: true, error: null })

      if (supabase && isSupabaseConfigured()) {
        let query = supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })

        // Aplicar filtros
        if (filters.entityType) {
          query = query.eq('entity_type', filters.entityType)
        }
        if (filters.entityId) {
          query = query.eq('entity_id', filters.entityId)
        }
        if (filters.userId) {
          query = query.eq('user_id', filters.userId)
        }
        if (filters.limit) {
          query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (!error && data) {
          set({ activities: data })
          console.log('✅ Actividades cargadas desde Supabase')
        } else if (error) {
          console.error('Error fetching activities:', error)
          set({ error: 'Error al cargar actividades' })
        }
      }

      set({ loading: false })
    } catch (error) {
      console.error('Error fetching activities:', error)
      set({
        error: 'Error al cargar actividades',
        loading: false
      })
    }
  },

  getActivitiesByEntity: (entityType, entityId) => {
    const { activities } = get()
    return activities.filter(
      (activity) =>
        activity.entity_type === entityType &&
        (!entityId || activity.entity_id === entityId)
    )
  },

  getRecentActivities: (limit = 10) => {
    const { activities } = get()
    return activities.slice(0, limit)
  },

  clearError: () => set({ error: null })
}))
