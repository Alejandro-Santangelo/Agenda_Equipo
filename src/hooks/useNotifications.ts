'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  user_id: string
  read: boolean
  created_at: string
  action_url?: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  
  // Acciones principales
  fetchNotifications: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearError: () => void
}

export const useNotifications = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      fetchNotifications: async () => {
        try {
          set({ loading: true, error: null })
          
          // Calcular count de no leídas localmente
          const { notifications } = get()
          const unreadCount = notifications.filter(n => !n.read).length
          set({ unreadCount })
          
          // Si hay Supabase configurado, intentar sincronizar
          if (supabase && isSupabaseConfigured()) {
            try {
              const { data: serverNotifications, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })

              if (!error && serverNotifications) {
                const unreadCount = serverNotifications.filter(n => !n.read).length
                set({ 
                  notifications: serverNotifications,
                  unreadCount 
                })
                console.log('✅ Notifications sincronizadas desde servidor')
              }
            } catch {
              console.log('📱 Notifications: usando datos locales')
            }
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('Error fetching notifications:', error)
          set({ 
            error: 'Error al cargar notificaciones',
            loading: false 
          })
        }
      },

      addNotification: async (notificationData) => {
        try {
          const newNotification: Notification = {
            ...notificationData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
          }

          // Agregar localmente primero (inmediato)
          const { notifications } = get()
          const updatedNotifications = [newNotification, ...notifications]
          const unreadCount = updatedNotifications.filter(n => !n.read).length
          
          set({ 
            notifications: updatedNotifications,
            unreadCount 
          })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('notifications').insert([newNotification])
              console.log('✅ Notification sincronizada con servidor')
            } catch {
              console.log('📱 Notification guardada localmente')
            }
          }

        } catch (error) {
          console.error('Error adding notification:', error)
          set({ error: 'Error al agregar notificación' })
        }
      },

      markAsRead: async (id) => {
        try {
          const { notifications } = get()
          const updatedNotifications = notifications.map(notification => 
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
          const unreadCount = updatedNotifications.filter(n => !n.read).length
          
          set({ 
            notifications: updatedNotifications,
            unreadCount 
          })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id)
              console.log('✅ Notification marcada como leída en servidor')
            } catch {
              console.log('📱 Notification marcada localmente')
            }
          }

        } catch (error) {
          console.error('Error marking notification as read:', error)
          set({ error: 'Error al marcar notificación' })
        }
      },

      markAllAsRead: async () => {
        try {
          const { notifications } = get()
          const updatedNotifications = notifications.map(notification => ({
            ...notification,
            read: true
          }))
          
          set({ 
            notifications: updatedNotifications,
            unreadCount: 0 
          })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('notifications')
                .update({ read: true })
                .neq('id', '')
              console.log('✅ Todas las notifications marcadas en servidor')
            } catch {
              console.log('📱 Notifications marcadas localmente')
            }
          }

        } catch (error) {
          console.error('Error marking all notifications as read:', error)
          set({ error: 'Error al marcar todas las notificaciones' })
        }
      },

      deleteNotification: async (id) => {
        try {
          const { notifications } = get()
          const updatedNotifications = notifications.filter(n => n.id !== id)
          const unreadCount = updatedNotifications.filter(n => !n.read).length
          
          set({ 
            notifications: updatedNotifications,
            unreadCount 
          })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('notifications').delete().eq('id', id)
              console.log('✅ Notification eliminada del servidor')
            } catch {
              console.log('📱 Notification eliminada localmente')
            }
          }

        } catch (error) {
          console.error('Error deleting notification:', error)
          set({ error: 'Error al eliminar notificación' })
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount
      })
    }
  )
)