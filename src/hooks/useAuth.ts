'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from '@/lib/store'
import { TeamMember } from '@/lib/supabase'
import { ADMIN_PERMISSIONS, DEFAULT_MEMBER_PERMISSIONS } from '@/types/permissions'

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
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

      login: async (email: string, password?: string) => {
        try {
          set({ loading: true })
          
          // Validar que se proporcione la contraseña
          if (!password) {
            return { success: false, error: 'La contraseña es requerida' }
          }
          
          // Importar utilidades
          const { verifyPassword } = await import('@/lib/password-utils')
          const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
          
          interface UserData {
            id: string
            email: string
            name: string
            phone?: string
            role: 'admin' | 'member'
            password_hash: string
            avatar_url?: string
            created_at?: string
            last_seen?: string
          }
          
          let userCredentials: UserData | null = null
          let passwordHash: string | null = null

          // Intentar buscar en Supabase primero
          if (supabase && isSupabaseConfigured()) {
            const { data: supabaseUser, error } = await supabase
              .from('team_members')
              .select('*')
              .eq('email', email.toLowerCase())
              .single()

            if (!error && supabaseUser) {
              userCredentials = supabaseUser as UserData
              passwordHash = supabaseUser.password_hash
              console.log('✅ Usuario encontrado en Supabase')
            }
          }
          
          // Si no está en Supabase, buscar en credenciales locales
          if (!userCredentials) {
            const { findUserByEmail } = await import('@/lib/user-credentials')
            const localCreds = findUserByEmail(email)
            
            if (!localCreds) {
              return { success: false, error: 'Usuario no encontrado' }
            }
            
            userCredentials = localCreds as UserData
            passwordHash = localCreds.password_hash
            console.log('⚠️ Usuario encontrado en credenciales locales (no sincronizado con Supabase)')
          }
          
          // Verificar contraseña
          if (!passwordHash) {
            return { success: false, error: 'Error en la configuración del usuario' }
          }

          const passwordIsValid = await verifyPassword(password, passwordHash)
          
          if (!passwordIsValid) {
            return { success: false, error: 'Contraseña incorrecta' }
          }
          
          // Crear perfil del usuario
          const profile: Profile = {
            id: userCredentials.id,
            email: userCredentials.email,
            name: userCredentials.name,
            phone: userCredentials.phone,
            role: userCredentials.role,
            avatar_url: userCredentials.avatar_url,
            created_at: userCredentials.created_at || new Date().toISOString(),
            updated_at: userCredentials.last_seen || new Date().toISOString()
          }
          
          set({ 
            currentUser: profile,
            isAuthenticated: true,
            loading: false 
          })

          // 🔄 SINCRONIZAR con AppStore
          const { setCurrentUser, teamMembers, setTeamMembers } = useAppStore.getState()
          const teamMember: TeamMember = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            phone: profile.phone,
            role: profile.role,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            last_active: new Date().toISOString(),
            permissions: profile.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_MEMBER_PERMISSIONS
          }
          setCurrentUser(teamMember)

          // Actualizar en la lista de teamMembers si existe
          const existingMemberIndex = teamMembers.findIndex(m => m.id === profile.id)
          if (existingMemberIndex >= 0) {
            const updatedMembers = [...teamMembers]
            updatedMembers[existingMemberIndex] = teamMember
            setTeamMembers(updatedMembers)
          }

          // Actualizar last_seen en Supabase
          if (supabase && isSupabaseConfigured()) {
            await supabase
              .from('team_members')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', profile.id)
          }
          
          console.log(`✅ Login exitoso para ${profile.name} (${profile.role})`)
          return { success: true }
          
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

          // Actualizar en Supabase
          const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
          
          if (supabase && isSupabaseConfigured()) {
            const { error: updateError } = await supabase
              .from('team_members')
              .update({
                name: updates.name,
                email: updates.email,
                phone: updates.phone,
                last_seen: new Date().toISOString()
              })
              .eq('id', currentUser.id)

            if (updateError) {
              console.error('Error al actualizar en Supabase:', updateError)
              return { success: false, error: 'Error al actualizar en la base de datos' }
            }

            console.log('✅ Perfil actualizado en Supabase exitosamente')
          }

          // Actualizar localmente
          const updatedUser = { ...currentUser, ...updates, updated_at: new Date().toISOString() }
          set({ currentUser: updatedUser })
          
          // Actualizar en el store del equipo también
          const { setCurrentUser, teamMembers, setTeamMembers } = useAppStore.getState()
          const teamMember = {
            ...updatedUser,
            last_active: new Date().toISOString()
          }
          setCurrentUser(teamMember)

          // Actualizar en la lista de teamMembers también
          const updatedMembers = teamMembers.map(member => 
            member.id === currentUser.id 
              ? { ...member, ...updates, last_active: new Date().toISOString() }
              : member
          )
          setTeamMembers(updatedMembers)
          
          return { success: true }
        } catch (error) {
          console.error('Error en updateProfile:', error)
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

          // Hashear la nueva contraseña
          const { hashPassword } = await import('@/lib/password-utils')
          const newPasswordHash = await hashPassword(newPassword)

          // Actualizar en Supabase
          const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
          
          if (supabase && isSupabaseConfigured()) {
            const { error: updateError } = await supabase
              .from('team_members')
              .update({
                password_hash: newPasswordHash,
                last_seen: new Date().toISOString()
              })
              .eq('id', currentUser.id)

            if (updateError) {
              console.error('Error al actualizar contraseña en Supabase:', updateError)
              return { success: false, error: 'Error al actualizar la contraseña en la base de datos' }
            }

            console.log('✅ Contraseña actualizada en Supabase exitosamente')
          }

          console.log('✅ Contraseña cambiada para:', currentUser.email)
          return { success: true }
        } catch (error) {
          console.error('Error en changePassword:', error)
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