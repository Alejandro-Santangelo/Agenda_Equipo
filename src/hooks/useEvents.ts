'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  all_day: boolean
  event_type: string  // Ahora acepta cualquier string para tipos personalizados
  priority: 'low' | 'medium' | 'high'
  created_by: string
  created_at: string
  updated_at: string
}

interface EventStore {
  events: Event[]
  loading: boolean
  error: string | null
  
  // Acciones principales
  fetchEvents: () => Promise<void>
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  
  // Utilidades
  clearError: () => void
  getEventsForDate: (date: string) => Event[]
}

export const useEvents = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      loading: false,
      error: null,

      fetchEvents: async () => {
        try {
          set({ loading: true, error: null })
          
          // Los datos locales están disponibles desde el store persistido
          
          // Si hay Supabase configurado, intentar sincronizar
          if (supabase && isSupabaseConfigured()) {
            try {
              const { data: serverEvents, error } = await supabase
                .from('events')
                .select('*')
                .is('archived_at', null)  // Solo eventos no archivados
                .order('start_date', { ascending: true })

              if (!error && serverEvents) {
                set({ events: serverEvents })
                console.log('✅ Events sincronizados desde servidor')
              }
            } catch {
              console.log('📱 Events: Error al sincronizar, usando datos locales')
            }
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('Error fetching events:', error)
          set({ 
            error: 'Error al cargar eventos',
            loading: false 
          })
        }
      },

      addEvent: async (eventData) => {
        try {
          const newEvent: Event = {
            ...eventData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Agregar localmente primero (inmediato)
          const { events } = get()
          const updatedEvents = [...events, newEvent]
          set({ events: updatedEvents })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('events').insert([newEvent])
              console.log('✅ Event sincronizado con servidor')
            } catch {
              console.log('📱 Event guardado localmente, se sincronizará después')
            }
          }

        } catch (error) {
          console.error('Error adding event:', error)
          set({ error: 'Error al agregar evento' })
        }
      },

      updateEvent: async (id, updates) => {
        try {
          const { events } = get()
          const updatedEvents = events.map(event => 
            event.id === id 
              ? { ...event, ...updates, updated_at: new Date().toISOString() }
              : event
          )
          
          set({ events: updatedEvents })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('events')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
              console.log('✅ Event actualizado en servidor')
            } catch {
              console.log('📱 Event actualizado localmente, se sincronizará después')
            }
          }

        } catch (error) {
          console.error('Error updating event:', error)
          set({ error: 'Error al actualizar evento' })
        }
      },

      deleteEvent: async (id) => {
        try {
          const { events } = get()
          const updatedEvents = events.filter(event => event.id !== id)
          set({ events: updatedEvents })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('events').delete().eq('id', id)
              console.log('✅ Event eliminado del servidor')
            } catch {
              console.log('📱 Event eliminado localmente, se sincronizará después')
            }
          }

        } catch (error) {
          console.error('Error deleting event:', error)
          set({ error: 'Error al eliminar evento' })
        }
      },

      clearError: () => set({ error: null }),
      
      getEventsForDate: (date: string) => {
        const { events } = get()
        const targetDate = new Date(date).toDateString()
        return events.filter(event => {
          const eventDate = new Date(event.start_date).toDateString()
          return eventDate === targetDate
        })
      }
    }),
    {
      name: 'events-storage',
      partialize: (state) => ({ 
        events: state.events
      })
    }
  )
)

// 🔄 Configurar Realtime para eventos
if (typeof window !== 'undefined' && supabase && isSupabaseConfigured()) {
  supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        const store = useEvents.getState()
        
        if (payload.eventType === 'INSERT') {
          const newEvent = payload.new as Event
          const exists = store.events.find(e => e.id === newEvent.id)
          if (!exists) {
            // Crear nuevo array inmutable para forzar re-render
            const updatedEvents = [...store.events, newEvent]
            useEvents.setState({ events: updatedEvents })
            console.log('🔄 Nuevo evento recibido en tiempo real:', newEvent.title)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedEvent = payload.new as Event
          // Crear nuevo array inmutable para forzar re-render
          const updatedEvents = store.events.map(e => 
            e.id === updatedEvent.id ? updatedEvent : e
          )
          useEvents.setState({ events: updatedEvents })
          console.log('🔄 Evento actualizado en tiempo real:', updatedEvent.title)
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as Event).id
          // Crear nuevo array inmutable para forzar re-render
          const updatedEvents = store.events.filter(e => e.id !== deletedId)
          useEvents.setState({ events: updatedEvents })
          console.log('🔄 Evento eliminado en tiempo real')
        }
      }
    )
    .subscribe()

  console.log('✅ Supabase Realtime activado para events')
}