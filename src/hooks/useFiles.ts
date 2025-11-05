'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface SharedFile {
  id: string
  name: string
  type: 'upload' | 'link'
  file_type: string
  size_bytes?: number
  url?: string
  shared_by: string
  created_at: string
  description?: string
  tags?: string[]
  download_count?: number
  
  // Alias para compatibilidad con código existente
  size?: number
  drive_url?: string
  uploaded_by?: string
  shared_with?: string[]
  comments?: Array<{
    id: string
    user_id: string
    text: string
    created_at: string
  }>
}

interface FileStore {
  files: SharedFile[]
  loading: boolean
  error: string | null
  
  // Acciones
  fetchFiles: () => Promise<void>
  addFile: (file: SharedFile) => Promise<void>
  updateFile: (id: string, updates: Partial<SharedFile>) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  
  // Utilidades
  clearError: () => void
  getFilesByType: (type: 'upload' | 'link') => SharedFile[]
}

export const useFiles = create<FileStore>()(
  persist(
    (set, get) => ({
      files: [],
      loading: false,
      error: null,

      fetchFiles: async () => {
        try {
          console.log('🔍 fetchFiles iniciado')
          set({ loading: true, error: null })
          
          // Si hay Supabase configurado, intentar sincronizar
          if (supabase && isSupabaseConfigured()) {
            console.log('🔍 Supabase configurado, consultando shared_files...')
            try {
              const { data: serverFiles, error } = await supabase
                .from('shared_files')
                .select('*')
                .order('created_at', { ascending: false })

              console.log('🔍 Respuesta de Supabase:', { serverFiles, error })

              if (!error && serverFiles) {
                set({ files: serverFiles })
                console.log('✅ Archivos sincronizados desde servidor:', serverFiles.length)
                console.log('📄 Archivos:', serverFiles)
              } else if (error) {
                console.error('❌ Error al cargar archivos desde Supabase:', error)
              }
            } catch (err) {
              console.error('❌ Excepción en fetchFiles:', err)
              console.log('📱 Archivos: usando datos locales')
            }
          } else {
            console.log('⚠️ Supabase no configurado o no disponible')
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('❌ Error general en fetchFiles:', error)
          set({ 
            error: 'Error al cargar archivos',
            loading: false 
          })
        }
      },

      addFile: async (fileData) => {
        try {
          console.log('🔍 addFile iniciado con:', fileData)
          
          // Agregar localmente primero (inmediato)
          const { files } = get()
          const updatedFiles = [...files, fileData]
          set({ files: updatedFiles })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              console.log('🔍 Insertando en Supabase shared_files...')
              
              // Preparar datos para Supabase (sin id ni created_at, los genera automáticamente)
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, created_at, ...dataForSupabase } = fileData
              
              const { data, error } = await supabase
                .from('shared_files')
                .insert([dataForSupabase])
                .select()
              
              if (error) {
                console.error('❌ Error al insertar en Supabase:', error)
                console.error('❌ Detalle del error:', error.message)
              } else {
                console.log('✅ Archivo sincronizado con servidor:', data)
                // Actualizar el archivo local con el ID real de Supabase
                if (data && data[0]) {
                  const updatedFiles = files.map(f => 
                    f.id === id ? { ...f, id: data[0].id } : f
                  )
                  set({ files: [...updatedFiles, data[0]] })
                }
              }
            } catch (err) {
              console.error('❌ Excepción al insertar archivo:', err)
              console.log('📱 Archivo guardado localmente')
            }
          } else {
            console.log('⚠️ Supabase no configurado, archivo solo local')
          }

        } catch (error) {
          console.error('❌ Error general en addFile:', error)
          set({ error: 'Error al agregar archivo' })
        }
      },

      updateFile: async (id, updates) => {
        try {
          const { files } = get()
          const updatedFiles = files.map(file => 
            file.id === id 
              ? { ...file, ...updates }
              : file
          )
          
          set({ files: updatedFiles })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('shared_files')
                .update(updates)
                .eq('id', id)
              console.log('✅ Archivo actualizado en servidor')
            } catch {
              console.log('📱 Archivo actualizado localmente')
            }
          }

        } catch (error) {
          console.error('Error updating file:', error)
          set({ error: 'Error al actualizar archivo' })
        }
      },

      deleteFile: async (id) => {
        try {
          const { files } = get()
          const updatedFiles = files.filter(file => file.id !== id)
          set({ files: updatedFiles })

          // Sincronizar con servidor si está disponible
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase.from('shared_files').delete().eq('id', id)
              console.log('✅ Archivo eliminado del servidor')
            } catch {
              console.log('📱 Archivo eliminado localmente')
            }
          }

        } catch (error) {
          console.error('Error deleting file:', error)
          set({ error: 'Error al eliminar archivo' })
        }
      },

      clearError: () => set({ error: null }),
      
      getFilesByType: (type: 'upload' | 'link') => {
        const { files } = get()
        return files.filter(file => file.type === type)
      }
    }),
    {
      name: 'files-storage',
      partialize: (state) => ({ 
        files: state.files
      })
    }
  )
)

// 🔄 Configurar Realtime para sincronización automática
if (typeof window !== 'undefined' && supabase && isSupabaseConfigured()) {
  supabase
    .channel('files-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shared_files' },
      (payload) => {
        const store = useFiles.getState()
        
        if (payload.eventType === 'INSERT') {
          const newFile = payload.new as SharedFile
          const exists = store.files.find(f => f.id === newFile.id)
          if (!exists) {
            const updatedFiles = [...store.files, newFile]
            useFiles.setState({ files: updatedFiles })
            console.log('🔄 Nuevo archivo recibido en tiempo real:', newFile.name)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedFile = payload.new as SharedFile
          const updatedFiles = store.files.map(f => 
            f.id === updatedFile.id ? updatedFile : f
          )
          useFiles.setState({ files: updatedFiles })
          console.log('🔄 Archivo actualizado en tiempo real:', updatedFile.name)
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as SharedFile).id
          const updatedFiles = store.files.filter(f => f.id !== deletedId)
          useFiles.setState({ files: updatedFiles })
          console.log('🔄 Archivo eliminado en tiempo real')
        }
      }
    )
    .subscribe()

  console.log('✅ Supabase Realtime activado para archivos')
}
