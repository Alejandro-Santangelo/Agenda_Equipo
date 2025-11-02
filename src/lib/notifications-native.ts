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

// Función para notificaciones de tareas (futuro)
export const notifyTaskAssignedNative = (data: {
  memberEmail: string;
  memberPhone?: string;
  taskTitle: string;
  assignedBy: string;
}) => {
  const subject = `📋 Nueva tarea asignada: ${data.taskTitle}`;
  const emailBody = `Hola,

${data.assignedBy} te ha asignado una nueva tarea:

📝 ${data.taskTitle}

Puedes verla en: ${APP_URL}

¡Saludos!`;

  const whatsappMessage = `📋 *Nueva tarea asignada*

${data.assignedBy} te asignó: *${data.taskTitle}*

Ver en la app: ${APP_URL}`;

  return {
    email: () => window.open(`mailto:${data.memberEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`, '_blank'),
    whatsapp: data.memberPhone ? () => {
      const cleanPhone = data.memberPhone!.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('54') ? cleanPhone : '54' + cleanPhone;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    } : null
  };
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