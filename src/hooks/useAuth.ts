'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from '@/lib/store'
import { TeamMember } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  name: string
  phone?: string
  role: 'admin' | 'member'
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthState {
  isAuthenticated: boolean
  currentUser: Profile | null
  loading: boolean
}

interface AuthStore extends AuthState {
  login: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  resetCredentials: (currentEmail: string, newEmail: string) => Promise<{ success: boolean; error?: string }>
  initialize: () => Promise<void>
  isAdmin: () => boolean
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      loading: false,

      initialize: async () => {
        try {
          set({ loading: true })
          
          // En desarrollo, verificar si hay un usuario guardado localmente
          const savedAuth = localStorage.getItem('dev-auth-storage')
          if (savedAuth) {
            const authData = JSON.parse(savedAuth)
            if (authData.state?.isAuthenticated && authData.state?.currentUser) {
              set({
                isAuthenticated: true,
                currentUser: authData.state.currentUser,
              })

              // Actualizar el usuario actual en el store del equipo
              const { setCurrentUser } = useAppStore.getState()
              const teamMember = {
                ...authData.state.currentUser,
                last_active: new Date().toISOString()
              }
              setCurrentUser(teamMember)
            }
          }
        } catch (error) {
          console.error('Error al inicializar auth:', error)
        } finally {
          set({ loading: false })
        }
      },

      login: async (email: string) => {
        try {
          set({ loading: true })
          
          // En modo offline o cuando Supabase no está configurado, usar datos locales
          const { teamMembers } = useAppStore.getState()
          const localUser = teamMembers.find(member => member.email.toLowerCase() === email.toLowerCase())
          
          if (localUser) {
            // Login exitoso con datos locales
            const profile: Profile = {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              phone: localUser.phone,
              role: localUser.role,
              avatar_url: localUser.avatar_url,
              created_at: localUser.created_at,
              updated_at: localUser.last_active
            }
            
            set({ 
              currentUser: profile,
              isAuthenticated: true,
              loading: false 
            })
            
            return { success: true }
          }
          
          // Si no se encuentra localmente, error en modo offline
          return { success: false, error: 'Usuario no encontrado' }
          
        } catch (error) {
          console.error('Error during login:', error)
          return { success: false, error: 'Error durante el login' }
        } finally {
          set({ loading: false })
        }
      },

      register: async (email: string, password: string, name: string, phone?: string) => {
        try {
          set({ loading: true })
          
          // Verificar que solo admins puedan registrar nuevos usuarios
          const { isAdmin } = get()
          if (!isAdmin()) {
            return { success: false, error: 'Solo los administradores pueden registrar nuevos usuarios' }
          }

          // Verificar si el email ya existe localmente
          const { teamMembers } = useAppStore.getState()
          const existingUser = teamMembers.find(member => member.email.toLowerCase() === email.toLowerCase())

          if (existingUser) {
            return { success: false, error: 'Este email ya está registrado' }
          }

          // En modo offline, simplemente guardamos el usuario localmente
          // La sincronización con Supabase se hará cuando esté disponible
          const newMember: TeamMember = {
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
            name,
            phone: phone || undefined,
            role: 'member',
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            permissions: []
          }

          // Agregar al store local
          const { addTeamMember } = useAppStore.getState()
          addTeamMember(newMember)

          console.log('✅ Usuario registrado exitosamente en modo offline:', { email, name })
          return { success: true }
          
        } catch (error) {
          console.error('Error during registration:', error)
          return { success: false, error: 'Error de conexión con la base de datos' }
        } finally {
          set({ loading: false })
        }
      },

      updateProfile: async (updates: Partial<Profile> | Partial<TeamMember>) => {
        try {
          set({ loading: true })
          const { currentUser } = get()
          
          if (!currentUser) {
            return { success: false, error: 'Usuario no autenticado' }
          }

          // En desarrollo, actualizar localmente
          const updatedUser = { ...currentUser, ...updates, updated_at: new Date().toISOString() }
          set({ currentUser: updatedUser })
          
          // Actualizar en el store del equipo también
          const { setCurrentUser } = useAppStore.getState()
          const teamMember = {
            ...updatedUser,
            last_active: new Date().toISOString()
          }
          setCurrentUser(teamMember)
          
          return { success: true }
        } catch {
          return { success: false, error: 'Error de conexión' }
        } finally {
          set({ loading: false })
        }
      },

      changePassword: async (newPassword: string) => {
        try {
          set({ loading: true })

          const { currentUser } = get()
          if (!currentUser) {
            return { success: false, error: 'Usuario no autenticado' }
          }

          // En desarrollo, simular cambio exitoso
          console.log('Cambiando contraseña para:', currentUser.email, 'Nueva contraseña:', newPassword)
          return { success: true }
        } catch {
          return { success: false, error: 'Error de conexión' }
        } finally {
          set({ loading: false })
        }
      },

      resetCredentials: async (currentEmail: string, newEmail: string) => {
        try {
          set({ loading: true })

          // Verificar que el usuario actual tenga permisos para resetear credenciales
          const { currentUser } = get()
          if (!currentUser) {
            return { success: false, error: 'Usuario no autenticado' }
          }

          // En modo offline, simplemente actualizar localmente
          const { teamMembers, setTeamMembers } = useAppStore.getState()
          const userToUpdate = teamMembers.find(member => member.email === currentEmail)

          if (!userToUpdate) {
            return { success: false, error: 'Usuario no encontrado' }
          }

          // Si el nuevo email es diferente, verificar que no exista localmente
          if (currentEmail !== newEmail) {
            const existingUser = teamMembers.find(member => member.email === newEmail)
            if (existingUser) {
              return { success: false, error: 'El nuevo email ya está en uso' }
            }
          }

          // En modo offline, actualizar localmente
          const updatedMembers = teamMembers.map(member => 
            member.email === currentEmail 
              ? { ...member, email: newEmail, last_active: new Date().toISOString() }
              : member
          )

          // Actualizar en el store
          setTeamMembers(updatedMembers)

          console.log('✅ Credenciales reseteadas exitosamente en modo offline:', { currentEmail, newEmail })
          return { success: true }
          
        } catch (error) {
          console.error('Error during credentials reset:', error)
          return { success: false, error: 'Error de conexión con la base de datos' }
        } finally {
          set({ loading: false })
        }
      },

      logout: async () => {
        try {
          set({
            isAuthenticated: false,
            currentUser: null,
          })
          
          // Limpiar usuario actual del store del equipo
          const { setCurrentUser } = useAppStore.getState()
          setCurrentUser(null)
        } catch (error) {
          console.error('Error al cerrar sesión:', error)
        }
      },

      isAdmin: () => {
        const { currentUser } = get()
        return currentUser?.role === 'admin'
      }
    }),
    {
      name: 'dev-auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser 
      })
    }
  )
)

export const useAuth = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    loading, 
    login, 
    logout, 
    register, 
    updateProfile, 
    changePassword, 
    resetCredentials,
    initialize, 
    isAdmin 
  } = useAuthStore()
  
  return {
    isAuthenticated,
    currentUser,
    user: null,
    loading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    resetCredentials,
    initialize,
    isAdmin: isAdmin()
  }
}