// Sincronización global con Supabase
// Este archivo maneja la carga inicial y sincronización de todos los datos

import { supabase, isSupabaseConfigured } from './supabase'
import { useAppStore } from './store'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'

/**
 * Sincroniza todos los datos desde Supabase al store local
 * Se debe llamar al iniciar la aplicación después del login
 */
export async function syncAllDataFromSupabase() {
  if (!supabase || !isSupabaseConfigured()) {
    console.log('⚠️ Supabase no configurado, usando datos locales')
    return {
      success: false,
      message: 'Trabajando en modo offline'
    }
  }

  console.log('🔄 Iniciando sincronización completa con Supabase...')
  const errors: string[] = []

  try {
    // 1. Sincronizar team_members
    console.log('👥 Sincronizando miembros del equipo...')
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && members) {
        const { setTeamMembers } = useAppStore.getState()
        setTeamMembers(members)
        console.log(`✅ ${members.length} miembros sincronizados`)
      }
    } catch (error) {
      errors.push('Error al sincronizar miembros')
      console.error('❌ Error en team_members:', error)
    }

    // 2. Sincronizar archivos compartidos
    console.log('📁 Sincronizando archivos compartidos...')
    try {
      const { data: files, error } = await supabase
        .from('shared_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && files) {
        // Mapear al formato local
        const mappedFiles = files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type as 'upload' | 'link',
          file_type: file.file_type,
          file_url: file.type === 'upload' ? file.url : undefined,
          drive_url: file.type === 'link' ? file.url : undefined,
          size: file.size_bytes,
          uploaded_by: file.shared_by,
          shared_with: [], // Se puede extender con una tabla de relaciones
          created_at: file.created_at,
          comments: [] // Se puede extender con una tabla de comentarios
        }))
        
        const { setSharedFiles } = useAppStore.getState()
        await setSharedFiles(mappedFiles)
        console.log(`✅ ${files.length} archivos sincronizados`)
      }
    } catch (error) {
      errors.push('Error al sincronizar archivos')
      console.error('❌ Error en shared_files:', error)
    }

    // 3. Sincronizar mensajes del chat
    console.log('💬 Sincronizando mensajes del chat...')
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          team_members (
            name
          )
        `)
        .order('created_at', { ascending: true })

      if (!error && messages) {
        const mappedMessages = messages.map(msg => ({
          id: msg.id,
          message: msg.message,
          user_id: msg.sent_by,
          user_name: msg.team_members?.name || 'Usuario',
          created_at: msg.created_at,
          edited_at: msg.edited_at,
          file_attachments: []
        }))
        
        const { setChatMessages } = useAppStore.getState()
        await setChatMessages(mappedMessages)
        console.log(`✅ ${messages.length} mensajes sincronizados`)
      }
    } catch (error) {
      errors.push('Error al sincronizar chat')
      console.error('❌ Error en chat_messages:', error)
    }

    // 4. Sincronizar proyectos
    console.log('📊 Sincronizando proyectos...')
    try {
      const tasksStore = useTasks.getState()
      await tasksStore.fetchProjects()
      console.log('✅ Proyectos sincronizados')
    } catch (error) {
      errors.push('Error al sincronizar proyectos')
      console.error('❌ Error en projects:', error)
    }

    // 5. Sincronizar tareas
    console.log('✅ Sincronizando tareas...')
    try {
      const tasksStore = useTasks.getState()
      await tasksStore.fetchTasks()
      console.log('✅ Tareas sincronizadas')
    } catch (error) {
      errors.push('Error al sincronizar tareas')
      console.error('❌ Error en tasks:', error)
    }

    // 6. Sincronizar eventos
    console.log('📅 Sincronizando eventos...')
    try {
      const eventsStore = useEvents.getState()
      await eventsStore.fetchEvents()
      console.log('✅ Eventos sincronizados')
    } catch (error) {
      errors.push('Error al sincronizar eventos')
      console.error('❌ Error en events:', error)
    }

    console.log('🎉 Sincronización completa finalizada')
    
    if (errors.length > 0) {
      return {
        success: false,
        message: `Sincronización parcial: ${errors.join(', ')}`,
        errors
      }
    }

    return {
      success: true,
      message: 'Todos los datos sincronizados correctamente'
    }

  } catch (error) {
    console.error('❌ Error crítico en sincronización:', error)
    return {
      success: false,
      message: 'Error crítico en la sincronización',
      error
    }
  }
}

/**
 * Sincroniza solo los datos esenciales (para carga rápida inicial)
 */
export async function syncEssentialData() {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Modo offline' }
  }

  console.log('⚡ Cargando datos esenciales...')

  try {
    // Cargar solo miembros y mensajes recientes
    const [membersResult, messagesResult] = await Promise.all([
      supabase.from('team_members').select('*').eq('is_active', true),
      supabase.from('chat_messages').select('*, team_members(name)').order('created_at', { ascending: false }).limit(50)
    ])

    if (membersResult.data) {
      const { setTeamMembers } = useAppStore.getState()
      setTeamMembers(membersResult.data)
    }

    if (messagesResult.data) {
      const mappedMessages = messagesResult.data.reverse().map(msg => ({
        id: msg.id,
        message: msg.message,
        user_id: msg.sent_by,
        user_name: msg.team_members?.name || 'Usuario',
        created_at: msg.created_at,
        edited_at: msg.edited_at,
        file_attachments: []
      }))
      
      const { setChatMessages } = useAppStore.getState()
      await setChatMessages(mappedMessages)
    }

    console.log('✅ Datos esenciales cargados')
    return { success: true, message: 'Datos esenciales cargados' }

  } catch (error) {
    console.error('Error cargando datos esenciales:', error)
    return { success: false, message: 'Error en carga esencial' }
  }
}

/**
 * Función para forzar re-sincronización manual
 */
export async function forceSync() {
  console.log('🔄 Forzando re-sincronización...')
  return await syncAllDataFromSupabase()
}
