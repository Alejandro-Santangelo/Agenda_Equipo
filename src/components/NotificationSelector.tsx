'use client'

import { useState, useEffect } from 'react'
import { Check, Mail, MessageSquare, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'member'
}

interface NotificationSelectorProps {
  isVisible: boolean
  onRecipientsChange: (recipients: TeamMember[]) => void
  notificationType: 'task' | 'chat' | 'event' | 'file'
  className?: string
}

export default function NotificationSelector({ 
  isVisible, 
  onRecipientsChange, 
  notificationType,
  className = ''
}: NotificationSelectorProps) {
  const { isAdmin } = useAuth()
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  // Por ahora, solo los admins pueden enviar y seleccionar destinatarios
  // Más adelante extenderemos con el sistema de permisos completo
  const canSelectRecipients = isAdmin
  const canSendNotifications = isAdmin

  useEffect(() => {
    if (isVisible && canSelectRecipients) {
      fetchTeamMembers()
    }
  }, [isVisible, canSelectRecipients])

  useEffect(() => {
    // Notificar cambios en los destinatarios seleccionados
    const recipients = teamMembers.filter(member => selectedRecipients.includes(member.id))
    onRecipientsChange(recipients)
  }, [selectedRecipients, teamMembers, onRecipientsChange])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      // Simular llamada a API - reemplazar con llamada real a Supabase
      const response = await fetch('/api/team-members')
      const data = await response.json()
      
      if (data.success) {
        setTeamMembers(data.members)
        // Seleccionar todos por defecto
        setSelectedRecipients(data.members.map((member: TeamMember) => member.id))
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      // Mostrar error y dejar lista vacía
      setTeamMembers([])
      setSelectedRecipients([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRecipient = (memberId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const selectAll = () => {
    setSelectedRecipients(teamMembers.map(member => member.id))
  }

  const selectNone = () => {
    setSelectedRecipients([])
  }

  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'task': return <Bell className="w-4 h-4 text-orange-500" />
      case 'chat': return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'event': return <Mail className="w-4 h-4 text-blue-500" />
      case 'file': return <Mail className="w-4 h-4 text-purple-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationLabel = () => {
    switch (notificationType) {
      case 'task': return 'Notificar sobre tarea'
      case 'chat': return 'Notificar mensaje'
      case 'event': return 'Notificar evento'
      case 'file': return 'Notificar archivo'
      default: return 'Enviar notificación'
    }
  }

  // Si no tiene permisos, no mostrar nada
  if (!canSendNotifications || !isVisible) {
    return null
  }

  // Si no puede seleccionar destinatarios pero sí enviar, mostrar solo info
  if (!canSelectRecipients) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2 text-blue-700">
          {getNotificationIcon()}
          <span className="text-sm font-medium">
            Se enviará notificación a todo el equipo
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getNotificationIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getNotificationLabel()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            Todos
          </button>
          <span className="text-gray-400">|</span>
          <button
            type="button"
            onClick={selectNone}
            className="text-xs text-gray-600 hover:text-gray-700 transition-colors"
          >
            Ninguno
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500 mt-2">Cargando miembros...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {teamMembers.map((member) => (
            <label
              key={member.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(member.id)}
                  onChange={() => toggleRecipient(member.id)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  selectedRecipients.includes(member.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {selectedRecipients.includes(member.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {member.name}
                  </span>
                  {member.role === 'admin' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </span>
                  {member.phone && (
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>{selectedRecipients.length}</strong> de <strong>{teamMembers.length}</strong> miembros seleccionados
          {selectedRecipients.length > 0 && (
            <span className="ml-2">
              • Se abrirán las apps nativas para enviar
            </span>
          )}
        </p>
      </div>
    </div>
  )
}