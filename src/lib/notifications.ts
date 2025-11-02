// =============================================================================
// 🔔 SISTEMA DE NOTIFICACIONES - EMAIL Y WHATSAPP
// Servicio para envío automático de notificaciones al equipo
// =============================================================================

// Importaciones dinámicas para evitar errores en build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resend: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let twilioClient: any = null;

// Función para inicializar Resend solo cuando se necesite
const getResend = async () => {
  if (!resend && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Función para inicializar Twilio solo cuando se necesite
const getTwilio = async () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const { Twilio } = await import('twilio');
    twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// 🌐 URL de la aplicación
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agenda-equipo.vercel.app/';

// =============================================================================
// 📧 TEMPLATES DE EMAIL
// =============================================================================

const emailTemplates = {
  // 🆕 Email de bienvenida para nuevo miembro
  welcomeNewMember: (data: {
    name: string;
    email: string;
    password: string;
    invitedBy: string;
  }) => ({
    subject: `🎉 ¡Bienvenida ${data.name}! - Agenda Colaborativa del Equipo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
            .credentials { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .highlight { color: #8b5cf6; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Bienvenida al Equipo!</h1>
              <p>Ya formas parte de nuestra Agenda Colaborativa</p>
            </div>
            
            <div class="content">
              <h2>Hola <span class="highlight">${data.name}</span>,</h2>
              
              <p><strong>${data.invitedBy}</strong> te ha invitado a unirte a nuestro equipo colaborativo. ¡Estamos emocionados de tenerte con nosotras! 🚀</p>
              
              <div class="credentials">
                <h3>🔑 Tus credenciales de acceso:</h3>
                <p><strong>🌐 URL:</strong> <a href="${APP_URL}" target="_blank">${APP_URL}</a></p>
                <p><strong>📧 Email:</strong> ${data.email}</p>
                <p><strong>🔒 Contraseña temporal:</strong> <code style="background: #fbbf24; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
              </div>
              
              <p><strong>📋 Qué puedes hacer en la app:</strong></p>
              <ul>
                <li>✅ Gestionar tareas colaborativas</li>
                <li>📅 Ver y crear eventos del calendario</li>
                <li>💬 Participar en el chat del equipo</li>
                <li>📁 Compartir y descargar archivos</li>
                <li>🔔 Recibir notificaciones importantes</li>
              </ul>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}" class="btn">🚀 Acceder a la App</a>
              </p>
              
              <p><strong>⚠️ Importante:</strong> Por favor, cambia tu contraseña desde tu perfil después del primer ingreso para mayor seguridad.</p>
            </div>
            
            <div class="footer">
              <p>Este mensaje fue enviado automáticamente por la Agenda Colaborativa del Equipo 💜</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // 📋 Email de nueva tarea asignada
  taskAssigned: (data: {
    memberName: string;
    taskTitle: string;
    assignedBy: string;
    dueDate?: string;
  }) => ({
    subject: `📋 Nueva tarea asignada: ${data.taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; }
            .task-card { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Nueva Tarea Asignada</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.memberName}</strong>,</p>
              <p><strong>${data.assignedBy}</strong> te ha asignado una nueva tarea:</p>
              
              <div class="task-card">
                <h3>📝 ${data.taskTitle}</h3>
                ${data.dueDate ? `<p><strong>📅 Fecha límite:</strong> ${data.dueDate}</p>` : ''}
              </div>
              
              <p><a href="${APP_URL}" style="color: #3b82f6;">Ver en la app →</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

// =============================================================================
// 📱 TEMPLATES DE WHATSAPP
// =============================================================================

const whatsappTemplates = {
  // 🆕 WhatsApp de bienvenida para nuevo miembro
  welcomeNewMember: (data: {
    name: string;
    email: string;
    password: string;
    invitedBy: string;
  }) => `
🎉 *¡Hola ${data.name}!*

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

¡Nos vemos en la app! 💜`,

  // 📋 WhatsApp de nueva tarea
  taskAssigned: (data: {
    memberName: string;
    taskTitle: string;
    assignedBy: string;
  }) => `
📋 *Nueva tarea asignada*

Hola ${data.memberName},
${data.assignedBy} te asignó: *${data.taskTitle}*

Ver en la app: ${APP_URL}`,

  // 📅 WhatsApp de recordatorio de reunión
  meetingReminder: (data: {
    memberName: string;
    eventTitle: string;
    startTime: string;
  }) => `
📅 *Recordatorio de reunión*

Hola ${data.memberName},
Tienes una reunión en 15 minutos:

🎯 *${data.eventTitle}*
⏰ ${data.startTime}

¡No te olvides! 😊`
};

// =============================================================================
// 📧 FUNCIONES DE ENVÍO DE EMAIL
// =============================================================================

// Tipos para diferentes notificaciones
type WelcomeData = {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
};

type TaskData = {
  memberName: string;
  taskTitle: string;
  assignedBy: string;
  dueDate?: string;
};

export const sendEmail = async (
  to: string,
  template: keyof typeof emailTemplates,
  data: WelcomeData | TaskData
) => {
  try {
    const resendClient = await getResend();
    if (!resendClient) {
      throw new Error('Resend no está configurado. Falta RESEND_API_KEY.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { subject, html } = emailTemplates[template](data as any);
    
    const response = await resendClient.emails.send({
      from: 'Agenda Equipo <no-reply@agenda-equipo.com>',
      to: [to],
      subject,
      html,
    });

    console.log('✅ Email enviado:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error };
  }
};

// =============================================================================
// 📱 FUNCIONES DE ENVÍO DE WHATSAPP
// =============================================================================

export const sendWhatsApp = async (
  to: string,
  template: keyof typeof whatsappTemplates,
  data: WelcomeData | TaskData
) => {
  try {
    const twilio = await getTwilio();
    if (!twilio) {
      throw new Error('Twilio no está configurado. Faltan TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN.');
    }

    // Formatear número de teléfono (agregar código de país si no lo tiene)
    const formattedNumber = formatPhoneNumber(to);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = whatsappTemplates[template](data as any);
    
    const response = await twilio.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // Tu número de WhatsApp Business
      to: `whatsapp:${formattedNumber}`,
      body: message,
    });

    console.log('✅ WhatsApp enviado:', response.sid);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    return { success: false, error };
  }
};

// =============================================================================
// 🚀 FUNCIÓN PRINCIPAL: NOTIFICAR NUEVO MIEMBRO
// =============================================================================

export const notifyNewMember = async (memberData: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  invitedBy: string;
}) => {
  console.log('🔔 Enviando notificaciones a nuevo miembro:', memberData.name);
  
  const results = {
    email: { success: false, error: null as unknown },
    whatsapp: { success: false, error: null as unknown }
  };

  // 📧 Enviar email
  try {
    const emailResult = await sendEmail(
      memberData.email,
      'welcomeNewMember',
      memberData
    );
    results.email = { success: emailResult.success, error: emailResult.error || null };
  } catch (error) {
    results.email = { success: false, error };
  }

  // 📱 Enviar WhatsApp (si tiene número)
  if (memberData.phone) {
    try {
      const whatsappResult = await sendWhatsApp(
        memberData.phone,
        'welcomeNewMember',
        memberData
      );
      results.whatsapp = { success: whatsappResult.success, error: whatsappResult.error || null };
    } catch (error) {
      results.whatsapp = { success: false, error };
    }
  }

  return results;
};

// =============================================================================
// 🔧 UTILIDADES
// =============================================================================

// Formatear número de teléfono para WhatsApp
const formatPhoneNumber = (phone: string): string => {
  // Limpiar el número
  let cleaned = phone.replace(/\D/g, '');
  
  // Si no empieza con código de país, asumir Argentina (+54)
  if (!cleaned.startsWith('54') && cleaned.length === 10) {
    cleaned = '54' + cleaned;
  }
  
  return '+' + cleaned;
};

// Validar si un email es válido
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar si un número de teléfono es válido
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};