'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { offlineDB } from '@/lib/offline'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)
  
  const { 
    setOnlineStatus, 
    setChatMessages, 
    setSharedFiles, 
    setTeamMembers,
  } = useAppStore()

  const loadOfflineData = useCallback(async () => {
    try {
      const [files, messages, members] = await Promise.all([
        offlineDB.getFiles(),
        offlineDB.getMessages(),
        offlineDB.getMembers()
      ])

      setSharedFiles(files)
      setChatMessages(messages)
      if (members.length > 0) {
        setTeamMembers(members)
      }
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }, [setSharedFiles, setChatMessages, setTeamMembers])

  const fetchServerData = useCallback(async () => {
    // Solo intentar sincronizar si Supabase está configurado
    if (!supabase || !isSupabaseConfigured()) {
      console.log('🔧 Supabase no configurado - trabajando en modo offline')
      return
    }
    
    try {
      const [filesRes, messagesRes, membersRes] = await Promise.all([
        supabase.from('shared_files').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('team_members').select('*')
      ])

      if (filesRes.data) {
        setSharedFiles(filesRes.data)
        await Promise.all(filesRes.data.map(file => offlineDB.saveFile(file)))
      }

      if (messagesRes.data) {
        setChatMessages(messagesRes.data)
        await Promise.all(messagesRes.data.map(msg => offlineDB.saveMessage(msg)))
      }

      if (membersRes.data) {
        setTeamMembers(membersRes.data)
        await offlineDB.saveMembers(membersRes.data)
      }
    } catch (error) {
      console.error('Error fetching server data:', error)
    }
  }, [setSharedFiles, setChatMessages, setTeamMembers])

  const processSyncItem = async (item: { type: string; data: Record<string, unknown> }) => {
    // Solo procesar si Supabase está configurado
    if (!supabase || !isSupabaseConfigured()) {
      console.log(`🔧 Saltando sincronización de ${item.type} - Supabase no configurado`)
      return
    }
    
    try {
      switch (item.type) {
        case 'message':
          await supabase.from('chat_messages').insert(item.data)
          break
        case 'file':
          await supabase.from('shared_files').insert(item.data)
          break
        case 'member':
          await supabase.from('team_members').insert(item.data)
          break
      }
    } catch (error) {
      console.error(`Error syncing ${item.type}:`, error)
    }
  }

  const syncWithServer = useCallback(async () => {
    if (!isOnline || syncInProgress) return
    
    // Solo sincronizar si Supabase está configurado
    if (!supabase || !isSupabaseConfigured()) {
      console.log('🔧 Sincronización saltada - Supabase no configurado')
      return
    }
    
    setSyncInProgress(true)
    
    try {
      // Procesar cola de sincronización
      const syncQueue = await offlineDB.getSyncQueue()
      
      for (const item of syncQueue) {
        await processSyncItem(item)
      }
      
      // Limpiar cola después de sincronizar
      await offlineDB.clearSyncQueue()
      
      // Obtener datos actualizados del servidor
      await fetchServerData()
      
      toast.success('Sincronización completada')
    } catch (error) {
      console.error('Error syncing with server:', error)
      toast.error('Error en la sincronización')
    } finally {
      setSyncInProgress(false)
    }
  }, [isOnline, syncInProgress, setSyncInProgress, fetchServerData])

  const addOperationToQueue = async (type: string, data: Record<string, unknown>) => {
    await offlineDB.addToSyncQueue({
      type,
      data,
      timestamp: Date.now()
    })
  }

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return

    const handleOnline = () => {
      setIsOnline(true)
      setOnlineStatus(true)
      toast.success('Conexión restaurada - Sincronizando...')
      syncWithServer()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOnlineStatus(false)
      toast.error('Sin conexión - Trabajando offline')
    }

    // Verificar estado inicial
    setIsOnline(navigator.onLine)
    setOnlineStatus(navigator.onLine)

    // Escuchar cambios de conexión
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cargar datos offline al montar
    loadOfflineData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [hasMounted, setOnlineStatus, loadOfflineData, syncWithServer])

  return {
    isOnline: hasMounted ? isOnline : true,
    syncInProgress,
    syncWithServer,
    addOperationToQueue,
    loadOfflineData
  }
}