'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { notifyTaskByEmail, notifyTaskByWhatsApp, notifyEventByEmail, notifyEventByWhatsApp } from '@/lib/native-notifications'
import toast from 'react-hot-toast'

interface QuickNotifyButtonProps {
  type: 'task' | 'event'
  title: string
  description?: string
  dueDate?: string
  eventDate?: string
  eventType?: string
  createdBy: string
  recipients: Array<{
    name: string
    email: string
    phone?: string
  }>
}

export default function QuickNotifyButton({
  type,
  title,
  description,
  dueDate,
  eventDate,
  eventType,
  createdBy,
  recipients
}: QuickNotifyButtonProps) {
  const [sending, setSending] = useState(false)

  const handleNotifyByEmail = async () => {
    if (recipients.length === 0) {
      toast.error('No hay destinatarios seleccionados')
      return
    }

    setSending(true)
    let success = 0

    for (const recipient of recipients) {
      if (type === 'task') {
        const sent = notifyTaskByEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          taskTitle: title,
          taskDescription: description,
          assignedBy: createdBy,
          dueDate
        })
        if (sent) success++
      } else {
        const sent = notifyEventByEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          eventTitle: title,
          eventDate: eventDate || '',
          eventType: eventType || 'meeting',
          createdBy
        })
        if (sent) success++
      }
    }

    setSending(false)
    
    if (success > 0) {
      toast.success(`Se abrió el cliente de email para ${success} destinatario(s)`)
    } else {
      toast.error('No se pudo abrir el cliente de email')
    }
  }

  const handleNotifyByWhatsApp = async () => {
    if (recipients.length === 0) {
      toast.error('No hay destinatarios seleccionados')
      return
    }

    const recipientsWithPhone = recipients.filter(r => r.phone)
    
    if (recipientsWithPhone.length === 0) {
      toast.error('Ningún destinatario tiene número de WhatsApp')
      return
    }

    setSending(true)
    let success = 0

    for (const recipient of recipientsWithPhone) {
      if (type === 'task') {
        const sent = notifyTaskByWhatsApp({
          recipientPhone: recipient.phone!,
          recipientName: recipient.name,
          taskTitle: title,
          taskDescription: description,
          assignedBy: createdBy,
          dueDate
        })
        if (sent) success++
      } else {
        const sent = notifyEventByWhatsApp({
          recipientPhone: recipient.phone!,
          recipientName: recipient.name,
          eventTitle: title,
          eventDate: eventDate || '',
          eventType: eventType || 'meeting',
          createdBy
        })
        if (sent) success++
      }
      
      // Esperar 500ms entre mensajes para no saturar
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setSending(false)
    
    if (success > 0) {
      toast.success(`Se abrió WhatsApp para ${success} destinatario(s)`)
    } else {
      toast.error('No se pudo abrir WhatsApp')
    }
  }

  if (recipients.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 mt-4 pt-4 border-t">
      <button
        type="button"
        onClick={handleNotifyByEmail}
        disabled={sending}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Mail className="w-4 h-4" />
        Notificar por Email
      </button>
      
      <button
        type="button"
        onClick={handleNotifyByWhatsApp}
        disabled={sending || recipients.filter(r => r.phone).length === 0}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={recipients.filter(r => r.phone).length === 0 ? 'Ningún destinatario tiene WhatsApp' : ''}
      >
        <Send className="w-4 h-4" />
        Notificar por WhatsApp
      </button>
    </div>
  )
}
