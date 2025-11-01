'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { offlineDB } from '@/lib/offline'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ChatSection() {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    chatMessages, 
    addChatMessage, 
    setChatMessages,
    currentUser, 
    teamMembers,
    setUnreadCount 
  } = useAppStore()
  
  const { isOnline, addOperationToQueue } = useOfflineSync()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    // Marcar mensajes como leídos
    setUnreadCount(0)
  }, [setUnreadCount])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return

    const messageData = {
      id: `msg-${Date.now()}-${Math.random()}`,
      message: newMessage.trim(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      created_at: new Date().toISOString(),
    }

    // Limpiar input
    setNewMessage('')
    
    // Añadir mensaje localmente
    addChatMessage(messageData)
    await offlineDB.saveMessage(messageData)

    // Enviar al servidor si hay conexión y Supabase configurado
    if (isOnline && supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('chat_messages').insert([messageData])
      } catch (error) {
        console.error('Error sending message:', error)
        await addOperationToQueue('message', messageData)
        toast('Mensaje guardado localmente - Se enviará cuando haya conexión', {
          icon: '📱'
        })
      }
    } else {
      await addOperationToQueue('message', messageData)
      const reason = !supabase ? 'Modo offline' : 'Se enviará cuando haya conexión'
      toast(`Mensaje guardado localmente - ${reason}`, {
        icon: '📱'
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('Solo los administradores pueden eliminar mensajes')
      return
    }

    // Confirmar eliminación
    const confirmed = window.confirm('¿Estás segura de que quieres eliminar este mensaje?')
    if (!confirmed) return

    try {
      // Eliminar del estado local inmediatamente
      const updatedMessages = chatMessages.filter(msg => msg.id !== messageId)
      setChatMessages(updatedMessages)
      
      // Guardar en IndexedDB
      for (const msg of updatedMessages) {
        await offlineDB.saveMessage(msg)
      }

      // Sincronizar con servidor si hay conexión y Supabase configurado
      if (isOnline && supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('chat_messages').delete().eq('id', messageId)
          toast.success('Mensaje eliminado correctamente')
        } catch (error) {
          console.error('Error deleting message from server:', error)
          await addOperationToQueue('delete_message', { id: messageId })
          toast.success('Mensaje eliminado localmente - Se sincronizará cuando haya conexión')
        }
      } else {
        await addOperationToQueue('delete_message', { id: messageId })
        const reason = !supabase ? 'Modo offline' : 'Se sincronizará cuando haya conexión'
        toast.success(`Mensaje eliminado localmente - ${reason}`)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Error al eliminar el mensaje')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'dd/MM HH:mm', { locale: es })
    }
  }

  const getUserColor = (userId: string) => {
    const colors = [
      'from-pink-400 to-pink-500',
      'from-purple-400 to-purple-500', 
      'from-indigo-400 to-indigo-500',
      'from-blue-400 to-blue-500',
      'from-green-400 to-green-500',
      'from-yellow-400 to-yellow-500',
      'from-red-400 to-red-500',
    ]
    const index = parseInt(userId) % colors.length
    return colors[index]
  }

  // Agrupar mensajes por fecha
  const groupedMessages = chatMessages.reduce((groups: Record<string, typeof chatMessages>, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return 'Hoy'
    } else if (isYesterday(date)) {
      return 'Ayer'
    } else {
      return format(date, 'dd MMMM yyyy', { locale: es })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white/50 backdrop-blur-sm rounded-xl border border-pink-200/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-pink-200/50">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Chat del Equipo</h2>
          <p className="text-sm text-gray-600">
            {teamMembers.length} miembros • {isOnline ? 'En línea' : 'Sin conexión'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Avatars de miembros activos */}
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${getUserColor(member.id)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white`}
                title={member.name}
              >
                {member.name[0]}
              </div>
            ))}
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Inicia la conversación!</h3>
            <p className="text-gray-600">Sé la primera en enviar un mensaje al equipo</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {formatDateHeader(date)}
                </span>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.user_id === currentUser?.id
                  const member = teamMembers.find(m => m.id === message.user_id)
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getUserColor(message.user_id)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-1`}>
                            {message.user_name[0]}
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className={`${isOwnMessage ? 'text-right' : 'text-left'} group relative`}>
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.user_name}
                              </span>
                              {member?.role === 'admin' && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="relative">
                            <div
                              className={`inline-block px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.message}</p>
                            </div>
                            
                            {/* Botón de moderación para admin */}
                            {currentUser?.role === 'admin' && !isOwnMessage && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 flex items-center justify-center"
                                title="Eliminar mensaje (Moderación)"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(message.created_at)}
                            {!isOnline && (
                              <span className="ml-1 text-yellow-600">📱</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-pink-200/50">
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentUser ? "Escribe un mensaje..." : "Inicia sesión para chatear"}
              disabled={!currentUser}
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Smile size={20} />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !currentUser}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        

      </div>
    </div>
  )
}