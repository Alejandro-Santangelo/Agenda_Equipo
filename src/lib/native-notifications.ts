/**
 * 📧 NOTIFICACIONES NATIVAS SIN APIS EXTERNAS
 * Usa mailto: para email y api.whatsapp.com para WhatsApp
 */

interface EmailNotification {
  to: string
  subject: string
  body: string
}

interface WhatsAppNotification {
  phone: string
  message: string
}

/**
 * Envía email usando cliente nativo del dispositivo (mailto:)
 */
export function sendNativeEmail({ to, subject, body }: EmailNotification): boolean {
  try {
    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
    console.log('📧 Email abierto en cliente nativo')
    return true
  } catch (error) {
    console.error('❌ Error al abrir email:', error)
    return false
  }
}

/**
 * Envía WhatsApp usando api.whatsapp.com (funciona en móvil y desktop)
 */
export function sendNativeWhatsApp({ phone, message }: WhatsAppNotification): boolean {
  try {
    // Limpiar número de teléfono (solo dígitos)
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Formato: https://api.whatsapp.com/send?phone=NUMBER&text=MESSAGE
    const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
    
    window.open(whatsappLink, '_blank')
    console.log('📱 WhatsApp abierto con mensaje')
    return true
  } catch (error) {
    console.error('❌ Error al abrir WhatsApp:', error)
    return false
  }
}

/**
 * Notificación de tarea asignada - Email nativo
 */
export function notifyTaskByEmail({
  recipientEmail,
  recipientName,
  taskTitle,
  taskDescription,
  assignedBy,
  dueDate
}: {
  recipientEmail: string
  recipientName: string
  taskTitle: string
  taskDescription?: string
  assignedBy: string
  dueDate?: string
}) {
  const subject = `Nueva tarea asignada: ${taskTitle}`
  const body = `Hola ${recipientName},

${assignedBy} te ha asignado una nueva tarea:

📋 Tarea: ${taskTitle}
${taskDescription ? `📝 Descripción: ${taskDescription}\n` : ''}${dueDate ? `📅 Fecha límite: ${new Date(dueDate).toLocaleDateString('es-ES')}\n` : ''}
Asignada por: ${assignedBy}

Accede a la aplicación para ver más detalles.

---
Agenda Equipo
https://agenda-equipo.vercel.app`

  return sendNativeEmail({
    to: recipientEmail,
    subject,
    body
  })
}

/**
 * Notificación de tarea asignada - WhatsApp nativo
 */
export function notifyTaskByWhatsApp({
  recipientPhone,
  recipientName,
  taskTitle,
  taskDescription,
  assignedBy,
  dueDate
}: {
  recipientPhone: string
  recipientName: string
  taskTitle: string
  taskDescription?: string
  assignedBy: string
  dueDate?: string
}) {
  const message = `*Agenda Equipo - Nueva Tarea*

Hola ${recipientName},

${assignedBy} te ha asignado:
📋 *${taskTitle}*
${taskDescription ? `📝 ${taskDescription}\n` : ''}${dueDate ? `📅 Vence: ${new Date(dueDate).toLocaleDateString('es-ES')}\n` : ''}
👤 Asignada por: ${assignedBy}

Ver en app: https://agenda-equipo.vercel.app`

  return sendNativeWhatsApp({
    phone: recipientPhone,
    message
  })
}

/**
 * Notificación de evento - Email nativo
 */
export function notifyEventByEmail({
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventType,
  createdBy
}: {
  recipientEmail: string
  recipientName: string
  eventTitle: string
  eventDate: string
  eventType: string
  createdBy: string
}) {
  const eventTypeLabel = {
    meeting: 'Reunión',
    deadline: 'Fecha límite',
    reminder: 'Recordatorio',
    personal: 'Personal'
  }[eventType] || 'Evento'

  const subject = `Nuevo evento: ${eventTitle}`
  const body = `Hola ${recipientName},

${createdBy} ha creado un nuevo evento:

📅 ${eventTypeLabel}: ${eventTitle}
🕒 Fecha: ${new Date(eventDate).toLocaleString('es-ES')}
Creado por: ${createdBy}

Accede a la aplicación para ver más detalles.

---
Agenda Equipo
https://agenda-equipo.vercel.app`

  return sendNativeEmail({
    to: recipientEmail,
    subject,
    body
  })
}

/**
 * Notificación de evento - WhatsApp nativo
 */
export function notifyEventByWhatsApp({
  recipientPhone,
  recipientName,
  eventTitle,
  eventDate,
  eventType,
  createdBy
}: {
  recipientPhone: string
  recipientName: string
  eventTitle: string
  eventDate: string
  eventType: string
  createdBy: string
}) {
  const eventTypeEmoji = {
    meeting: '👥',
    deadline: '⏰',
    reminder: '🔔',
    personal: '📌'
  }[eventType] || '📅'

  const message = `*Agenda Equipo - Nuevo Evento*

Hola ${recipientName},

${createdBy} ha creado:
${eventTypeEmoji} *${eventTitle}*
🕒 ${new Date(eventDate).toLocaleString('es-ES')}
👤 Por: ${createdBy}

Ver en app: https://agenda-equipo.vercel.app`

  return sendNativeWhatsApp({
    phone: recipientPhone,
    message
  })
}
