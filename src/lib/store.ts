import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TeamMember, SharedFile, ChatMessage } from './supabase'
import { DEFAULT_MEMBER_PERMISSIONS, ADMIN_PERMISSIONS } from '@/types/permissions'

interface AppState {
  // User state
  currentUser: TeamMember | null
  isOnline: boolean
  
  // Team state
  teamMembers: TeamMember[]
  
  // Files state
  sharedFiles: SharedFile[]
  uploadProgress: Record<string, number>
  
  // Chat state
  chatMessages: ChatMessage[]
  unreadCount: number
  
  // UI state
  activeTab: 'files' | 'chat' | 'tasks' | 'calendar' | 'team' | 'stats' | 'notifications' | 'profile'
  isMobileMenuOpen: boolean
  
  // Actions
  setCurrentUser: (user: TeamMember | null) => void
  updateCurrentUser: (updates: Partial<TeamMember>) => void
  setOnlineStatus: (status: boolean) => void
  setTeamMembers: (members: TeamMember[]) => void
  addTeamMember: (member: TeamMember) => void
  removeTeamMember: (memberId: string) => void
  updateMemberPermissions: (memberId: string, permissions: string[]) => Promise<void>
  
  setSharedFiles: (files: SharedFile[]) => void
  addSharedFile: (file: SharedFile) => void
  removeSharedFile: (fileId: string) => void
  updateUploadProgress: (fileId: string, progress: number) => void
  
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void
  setUnreadCount: (count: number) => void
  
  setActiveTab: (tab: 'files' | 'chat' | 'tasks' | 'calendar' | 'team' | 'stats' | 'notifications' | 'profile') => void
  setMobileMenuOpen: (open: boolean) => void
}

// Función para obtener los miembros por defecto
const getDefaultMembers = () => [
  {
    id: '1',
    name: 'Paula',
    email: 'paula@equipo.com',
    role: 'admin' as const,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    permissions: ADMIN_PERMISSIONS,
  },
  {
    id: '2',
    name: 'Gabi',
    email: 'gabi@equipo.com',
    role: 'member' as const,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    permissions: DEFAULT_MEMBER_PERMISSIONS,
  },
  {
    id: '3',
    name: 'Caro',
    email: 'caro@equipo.com',
    role: 'member' as const,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    permissions: DEFAULT_MEMBER_PERMISSIONS,
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentUser: null,
      isOnline: true,
      teamMembers: getDefaultMembers(),
      sharedFiles: [],
      uploadProgress: {},
      chatMessages: [],
      unreadCount: 0,
      activeTab: 'files',
      isMobileMenuOpen: false,
      
      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      updateCurrentUser: (updates) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
      })),
      setOnlineStatus: (status) => set({ isOnline: status }),
      
      setTeamMembers: (members) => {
        // Verificar que todos los miembros por defecto estén presentes
        const defaultMembers = getDefaultMembers()
        const currentMembers = [...members]
        
        defaultMembers.forEach(defaultMember => {
          const exists = currentMembers.find(m => m.email === defaultMember.email)
          if (!exists) {
            console.log(`➕ Agregando miembro faltante: ${defaultMember.name}`)
            currentMembers.push(defaultMember)
          }
        })
        
        set({ teamMembers: currentMembers })
      },
      addTeamMember: (member) => set((state) => ({ 
        teamMembers: [...state.teamMembers, member] 
      })),
      removeTeamMember: (memberId) => set((state) => ({ 
        teamMembers: state.teamMembers.filter((m: TeamMember) => m.id !== memberId) 
      })),
      updateMemberPermissions: async (memberId, permissions) => {
        const { offlineDB } = await import('@/lib/offline')
        
        // Actualizar en el store local
        set((state) => ({
          teamMembers: state.teamMembers.map((member: TeamMember) =>
            member.id === memberId 
              ? { ...member, permissions }
              : member
          )
        }))
        
        // Guardar en IndexedDB
        try {
          await offlineDB.updateMember(memberId, { permissions })
        } catch (error) {
          console.error('Error updating member in offline storage:', error)
        }
        
        // TODO: Sincronizar con Supabase cuando esté configurado
        // await addOperationToQueue('member_update', { id: memberId, permissions })
      },
      
      setSharedFiles: (files) => set({ sharedFiles: files }),
      addSharedFile: (file) => set((state) => ({ 
        sharedFiles: [file, ...state.sharedFiles] 
      })),
      removeSharedFile: (fileId) => set((state) => ({ 
        sharedFiles: state.sharedFiles.filter(f => f.id !== fileId) 
      })),
      updateUploadProgress: (fileId, progress) => set((state) => ({
        uploadProgress: { ...state.uploadProgress, [fileId]: progress }
      })),
      
      setChatMessages: (messages) => set({ chatMessages: messages }),
      addChatMessage: (message) => set((state) => ({ 
        chatMessages: [...state.chatMessages, message] 
      })),
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    }),
    {
      name: 'agenda-equipo-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        teamMembers: state.teamMembers,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migración automática: verificar que todos los miembros por defecto estén presentes
          const defaultMembers = getDefaultMembers()
          const currentMembers = [...(state.teamMembers || [])]
          let needsUpdate = false
          
          defaultMembers.forEach(defaultMember => {
            const exists = currentMembers.find(m => m.email === defaultMember.email)
            if (!exists) {
              console.log(`🔄 Migrando: agregando ${defaultMember.name}`)
              currentMembers.push(defaultMember)
              needsUpdate = true
            }
          })
          
          if (needsUpdate) {
            state.teamMembers = currentMembers
          }
        }
      },
    }
  )
)

// Exportar también como useStore para compatibilidad
export const useStore = useAppStore