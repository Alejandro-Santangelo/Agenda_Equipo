// =============================================================================
// 📱 SISTEMA DE NOTIFICACIONES NATIVO - SIN APIs EXTERNAS
// Utiliza WhatsApp Web y cliente de email nativo del dispositivo
// =============================================================================

// 🌐 URL de la aplicación
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agenda-equipo.vercel.app/';

// =============================================================================
// 📧 TEMPLATES PARA EMAIL NATIVO
// =============================================================================

const createEmailTemplate = (data: {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
}) => {
  const subject = `🎉 ¡Bienvenida ${data.name}! - Agenda Colaborativa del Equipo`;
  
  const body = `Hola ${data.name},

${data.invitedBy} te ha invitado a unirte a nuestro equipo colaborativo. ¡Estamos emocionados de tenerte con nosotras! 🚀

🔑 TUS CREDENCIALES DE ACCESO:
🌐 URL: ${APP_URL}
📧 Email: ${data.email}
🔒 Contraseña temporal: ${data.password}

📋 QUÉ PUEDES HACER EN LA APP:
✅ Gestionar tareas colaborativas
📅 Ver y crear eventos del calendario
💬 Participar en el chat del equipo
📁 Compartir y descargar archivos
🔔 Recibir notificaciones importantes

⚠️ IMPORTANTE: Por favor, cambia tu contraseña desde tu perfil después del primer ingreso para mayor seguridad.

¡Nos vemos en la app! 💜

Este mensaje fue enviado automáticamente por la Agenda Colaborativa del Equipo.`;

  return { subject, body };
};

// =============================================================================
// 📱 TEMPLATES PARA WHATSAPP WEB
// =============================================================================

const createWhatsAppTemplate = (data: {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
}) => {
  const message = `🎉 *¡Hola ${data.name}!*

${data.invitedBy} te ha invitado a unirte a nuestro equipo colaborativo. ¡Bienvenida! 🚀

🔑 *Tus credenciales de acceso:*
🌐 *URL:* ${APP_URL}
📧 *Email:* ${data.email}
🔒 *Contraseña:* ${data.password}

📋 *En la app puedes:*
✅ Gestionar tareas del equipo
📅 Ver calendario colaborativo  
💬 Participar en el chat
📁 Compartir archivos
🔔 Recibir notificaciones

⚠️ *Importante:* Cambia tu contraseña después del primer ingreso.

¡Nos vemos en la app! 💜`;

  return message;
};

// =============================================================================
// 📧 FUNCIÓN PARA ABRIR CLIENTE DE EMAIL NATIVO
// =============================================================================

export const openNativeEmail = (data: {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
}) => {
  const { subject, body } = createEmailTemplate(data);
  
  // Crear mailto URL con todos los parámetros
  const mailtoUrl = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Abrir cliente de email nativo
  window.open(mailtoUrl, '_blank');
  
  console.log('📧 Cliente de email nativo abierto para:', data.email);
  return { success: true, method: 'native_email' };
};

// =============================================================================
// 📱 FUNCIÓN PARA ABRIR WHATSAPP WEB
// =============================================================================

export const openWhatsAppWeb = (data: {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
  phone: string;
}) => {
  const message = createWhatsAppTemplate(data);
  
  // Limpiar y formatear número de teléfono
  const cleanPhone = data.phone.replace(/\D/g, '');
  
  // Si no tiene código de país, asumir Argentina (+54)
  let formattedPhone = cleanPhone;
  if (!cleanPhone.startsWith('54') && cleanPhone.length === 10) {
    formattedPhone = '54' + cleanPhone;
  }
  
  // Crear URL de WhatsApp Web
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  // Abrir WhatsApp Web
  window.open(whatsappUrl, '_blank');
  
  console.log('📱 WhatsApp Web abierto para:', formattedPhone);
  return { success: true, method: 'whatsapp_web' };
};

// =============================================================================
// 🚀 FUNCIÓN PRINCIPAL: NOTIFICAR NUEVO MIEMBRO (NATIVO)
// =============================================================================

export const notifyNewMemberNative = (memberData: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  invitedBy: string;
}) => {
  console.log('🔔 Abriendo aplicaciones nativas para notificar a:', memberData.name);
  
  const results = {
    email: { success: false, method: 'none', attempted: false },
    whatsapp: { success: false, method: 'none', attempted: false }
  };

  // 📧 Abrir cliente de email nativo
  try {
    openNativeEmail(memberData);
    results.email = { success: true, method: 'native_email', attempted: true };
  } catch (error) {
    console.error('❌ Error abriendo email nativo:', error);
    results.email = { success: false, method: 'native_email', attempted: true };
  }

  // 📱 Abrir WhatsApp Web (si tiene número)
  if (memberData.phone && memberData.phone.trim()) {
    try {
      openWhatsAppWeb({
        ...memberData,
        phone: memberData.phone
      });
      results.whatsapp = { success: true, method: 'whatsapp_web', attempted: true };
    } catch (error) {
      console.error('❌ Error abriendo WhatsApp Web:', error);
      results.whatsapp = { success: false, method: 'whatsapp_web', attempted: true };
    }
  }

  return results;
};

// =============================================================================
// 🔧 UTILIDADES ADICIONALES
// =============================================================================

// =============================================================================
// 📋 NOTIFICACIONES DE TAREAS
// =============================================================================

export const notifyTaskAssignedNative = (data: {
  recipients: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  taskTitle: string;
  taskDescription?: string;
  assignedBy: string;
  dueDate?: string;
}) => {
  console.log('📋 Enviando notificaciones de tarea asignada a:', data.recipients.length, 'destinatarios');

  const results = {
    email: { attempted: 0, success: 0 },
    whatsapp: { attempted: 0, success: 0 }
  };

  data.recipients.forEach((recipient) => {
    // 📧 Template de email para tarea asignada
    const subject = `📋 Nueva tarea asignada: ${data.taskTitle}`;
    const emailBody = `Hola ${recipient.name},

${data.assignedBy} te ha asignado una nueva tarea:

📝 **${data.taskTitle}**
${data.taskDescription ? `\n📄 Descripción: ${data.taskDescription}` : ''}
${data.dueDate ? `\n📅 Fecha límite: ${new Date(data.dueDate).toLocaleDateString('es-AR')}` : ''}

🔗 Ver detalles: ${APP_URL}

¡Éxitos con la tarea!

---
Este es un recordatorio automático del sistema de gestión de tareas del equipo.`;

    // 📱 Template de WhatsApp para tarea asignada
    const whatsappMessage = `📋 *Nueva tarea asignada*

¡Hola ${recipient.name}!

${data.assignedBy} te asignó una nueva tarea:

📝 *${data.taskTitle}*
${data.taskDescription ? `\n📄 ${data.taskDescription}` : ''}
${data.dueDate ? `\n📅 Vence: ${new Date(data.dueDate).toLocaleDateString('es-AR')}` : ''}

🔗 Ver en la app: ${APP_URL}

¡Éxitos! 💪`;

    // Abrir cliente de email
    try {
      const mailtoUrl = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
      results.email.attempted++;
      results.email.success++;
      console.log('📧 Email abierto para:', recipient.email);
    } catch (error) {
      console.error('❌ Error abriendo email para', recipient.email, error);
      results.email.attempted++;
    }

    // Abrir WhatsApp si tiene número
    if (recipient.phone && recipient.phone.trim()) {
      try {
        const cleanPhone = recipient.phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('54') ? cleanPhone : '54' + cleanPhone;
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
        results.whatsapp.attempted++;
        results.whatsapp.success++;
        console.log('📱 WhatsApp abierto para:', formattedPhone);
      } catch (error) {
        console.error('❌ Error abriendo WhatsApp para', recipient.phone, error);
        results.whatsapp.attempted++;
      }
    }
  });

  return results;
};

export const notifyTaskCompletedNative = (data: {
  recipients: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  taskTitle: string;
  completedBy: string;
}) => {
  console.log('✅ Enviando notificaciones de tarea completada a:', data.recipients.length, 'destinatarios');

  const results = {
    email: { attempted: 0, success: 0 },
    whatsapp: { attempted: 0, success: 0 }
  };

  data.recipients.forEach((recipient) => {
    // 📧 Template de email para tarea completada
    const subject = `✅ Tarea completada: ${data.taskTitle}`;
    const emailBody = `Hola ${recipient.name},

¡Buenas noticias! ${data.completedBy} ha completado la tarea:

✅ **${data.taskTitle}**

🔗 Ver detalles: ${APP_URL}

¡Excelente trabajo en equipo! 🎉

---
Este es un recordatorio automático del sistema de gestión de tareas del equipo.`;

    // 📱 Template de WhatsApp para tarea completada
    const whatsappMessage = `✅ *Tarea completada*

¡Hola ${recipient.name}!

${data.completedBy} completó la tarea:

✅ *${data.taskTitle}*

🔗 Ver en la app: ${APP_URL}

¡Excelente trabajo! 🎉`;

    // Abrir cliente de email
    try {
      const mailtoUrl = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
      results.email.attempted++;
      results.email.success++;
    } catch (error) {
      console.error('❌ Error abriendo email para', recipient.email, error);
      results.email.attempted++;
    }

    // Abrir WhatsApp si tiene número
    if (recipient.phone && recipient.phone.trim()) {
      try {
        const cleanPhone = recipient.phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('54') ? cleanPhone : '54' + cleanPhone;
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
        results.whatsapp.attempted++;
        results.whatsapp.success++;
      } catch (error) {
        console.error('❌ Error abriendo WhatsApp para', recipient.phone, error);
        results.whatsapp.attempted++;
      }
    }
  });

  return results;
};

// Función para validar número de teléfono
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

// Función para formatear número para mostrar
export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+54 9 11 ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};