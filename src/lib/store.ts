import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TeamMember, SharedFile, ChatMessage } from './supabase'
import { DEFAULT_MEMBER_PERMISSIONS } from '@/types/permissions'

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
  
  setSharedFiles: (files: SharedFile[]) => Promise<void>
  addSharedFile: (file: SharedFile) => Promise<void>
  removeSharedFile: (fileId: string) => Promise<void>
  updateUploadProgress: (fileId: string, progress: number) => void
  
  setChatMessages: (messages: ChatMessage[]) => Promise<void>
  addChatMessage: (message: ChatMessage) => Promise<void>
  setUnreadCount: (count: number) => void
  
  setActiveTab: (tab: 'files' | 'chat' | 'tasks' | 'calendar' | 'team' | 'stats' | 'notifications' | 'profile') => void
  setMobileMenuOpen: (open: boolean) => void
}

// Función para obtener los miembros por defecto (solo los que existen en Supabase)
const getDefaultMembers = () => [
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
      
      setSharedFiles: async (files) => {
        set({ sharedFiles: files })
        
        // Sincronizar con Supabase si está configurado
        const { supabase, isSupabaseConfigured } = await import('./supabase')
        if (supabase && isSupabaseConfigured()) {
          try {
            const { data: serverFiles } = await supabase
              .from('shared_files')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (serverFiles && serverFiles.length > 0) {
              set({ sharedFiles: serverFiles })
              console.log('✅ Archivos sincronizados desde Supabase')
            }
          } catch {
            console.log('📱 Usando archivos locales')
          }
        }
      },
      
      addSharedFile: async (file) => {
        // Agregar localmente primero (inmediato)
        set((state) => ({ 
          sharedFiles: [file, ...state.sharedFiles] 
        }))
        
        // Sincronizar con Supabase
        const { supabase, isSupabaseConfigured } = await import('./supabase')
        if (supabase && isSupabaseConfigured()) {
          try {
            const { error } = await supabase.from('shared_files').insert([{
              id: file.id,
              name: file.name,
              type: file.type,
              file_type: file.file_type,
              url: file.type === 'link' ? file.drive_url : file.file_url,
              size_bytes: file.size,
              shared_by: file.uploaded_by,
              created_at: file.created_at
            }])
            
            if (!error) {
              console.log('✅ Archivo guardado en Supabase')
            }
          } catch {
            console.log('📱 Archivo guardado localmente, se sincronizará después')
          }
        }
      },
      
      removeSharedFile: async (fileId) => {
        // Eliminar localmente primero (inmediato)
        set((state) => ({ 
          sharedFiles: state.sharedFiles.filter(f => f.id !== fileId) 
        }))
        
        // Sincronizar con Supabase
        const { supabase, isSupabaseConfigured } = await import('./supabase')
        if (supabase && isSupabaseConfigured()) {
          try {
            await supabase.from('shared_files').delete().eq('id', fileId)
            console.log('✅ Archivo eliminado de Supabase')
          } catch {
            console.log('📱 Archivo eliminado localmente, se sincronizará después')
          }
        }
      },
      
      updateUploadProgress: (fileId, progress) => set((state) => ({
        uploadProgress: { ...state.uploadProgress, [fileId]: progress }
      })),
      
      setChatMessages: async (messages) => {
        set({ chatMessages: messages })
        
        // Sincronizar con Supabase si está configurado
        const { supabase, isSupabaseConfigured } = await import('./supabase')
        if (supabase && isSupabaseConfigured()) {
          try {
            const { data: serverMessages } = await supabase
              .from('chat_messages')
              .select('*')
              .order('created_at', { ascending: true })
            
            if (serverMessages && serverMessages.length > 0) {
              // Mapear a formato local
              const mappedMessages = serverMessages.map(msg => ({
                id: msg.id,
                message: msg.message,
                user_id: msg.sent_by,
                user_name: '', // Se completará con datos de team_members
                created_at: msg.created_at,
                edited_at: msg.edited_at,
                file_attachments: []
              }))
              set({ chatMessages: mappedMessages })
              console.log('✅ Mensajes sincronizados desde Supabase')
            }
          } catch {
            console.log('📱 Usando mensajes locales')
          }
        }
      },
      
      addChatMessage: async (message) => {
        // Agregar localmente primero (inmediato)
        set((state) => ({ 
          chatMessages: [...state.chatMessages, message] 
        }))
        
        // Sincronizar con Supabase
        const { supabase, isSupabaseConfigured } = await import('./supabase')
        if (supabase && isSupabaseConfigured()) {
          try {
            const { error } = await supabase.from('chat_messages').insert([{
              id: message.id,
              message: message.message,
              sent_by: message.user_id,
              created_at: message.created_at,
              message_type: 'text'
            }])
            
            if (!error) {
              console.log('✅ Mensaje guardado en Supabase')
            }
          } catch {
            console.log('📱 Mensaje guardado localmente, se sincronizará después')
          }
        }
      },
      
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

// 🔄 Configurar Realtime para archivos y chat
if (typeof window !== 'undefined') {
  (async () => {
    const { supabase, isSupabaseConfigured } = await import('./supabase')
    
    if (supabase && isSupabaseConfigured()) {
      // Subscripción a archivos compartidos
      supabase
        .channel('files-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shared_files' },
          (payload) => {
            const store = useAppStore.getState()
            
            if (payload.eventType === 'INSERT') {
              const newFile = payload.new as Record<string, unknown>
              const exists = store.sharedFiles.find(f => f.id === newFile.id)
              if (!exists) {
                const mappedFile = {
                  id: newFile.id as string,
                  name: newFile.file_name as string,
                  type: newFile.file_type === 'link' ? 'link' as const : 'upload' as const,
                  file_type: (newFile.mime_type as string) || 'application/octet-stream',
                  size: newFile.file_size as number,
                  uploaded_by: newFile.uploaded_by as string,
                  drive_url: newFile.url as string,
                  shared_with: [],
                  created_at: newFile.created_at as string,
                  comments: []
                }
                // Crear nuevo array inmutable para forzar re-render
                const updatedFiles = [...store.sharedFiles, mappedFile]
                useAppStore.setState({ sharedFiles: updatedFiles })
                console.log('🔄 Nuevo archivo recibido en tiempo real:', mappedFile.name)
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as Record<string, unknown>).id as string
              // Crear nuevo array inmutable para forzar re-render
              const updatedFiles = store.sharedFiles.filter(f => f.id !== deletedId)
              useAppStore.setState({ sharedFiles: updatedFiles })
              console.log('🔄 Archivo eliminado en tiempo real')
            }
          }
        )
        .subscribe()

      // Subscripción a mensajes de chat
      supabase
        .channel('chat-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            const store = useAppStore.getState()
            const newMessage = payload.new as Record<string, unknown>
            
            const exists = store.chatMessages.find(m => m.id === newMessage.id)
            if (!exists) {
              const mappedMessage = {
                id: newMessage.id as string,
                message: newMessage.message as string,
                user_id: newMessage.sent_by as string,
                user_name: store.teamMembers.find(m => m.id === newMessage.sent_by)?.name || 'Usuario',
                created_at: newMessage.created_at as string,
                edited_at: newMessage.edited_at as string | undefined,
                file_attachments: []
              }
              // Crear nuevo array inmutable para forzar re-render
              const updatedMessages = [...store.chatMessages, mappedMessage]
              useAppStore.setState({ chatMessages: updatedMessages })
              console.log('🔄 Nuevo mensaje recibido en tiempo real:', mappedMessage.message.substring(0, 30))
            }
          }
        )
        .subscribe()

      console.log('✅ Supabase Realtime activado para files y chat')
    }
  })()
}

// Exportar también como useStore para compatibilidad
export const useStore = useAppStore