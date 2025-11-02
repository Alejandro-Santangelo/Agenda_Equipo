// =============================================================================
// 🆕 API ROUTE: AGREGAR NUEVO MIEMBRO CON NOTIFICACIONES AUTOMÁTICAS
// Endpoint para que Paula pueda invitar nuevos miembros al equipo
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewMember } from '@/lib/notifications';
import crypto from 'crypto';

// Tipos para el request
interface AddMemberRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  invitedBy: string; // Nombre de quien invita (ej: "Paula")
}

export async function POST(request: NextRequest) {
  try {
    const body: AddMemberRequest = await request.json();
    
    // 🔍 Verificar configuración de Supabase
    if (!supabase) {
      return NextResponse.json(
        { error: 'Base de datos no configurada. Configurar variables de entorno de Supabase.' },
        { status: 500 }
      );
    }
    
    // 🔍 Validar datos requeridos
    if (!body.name || !body.email || !body.password || !body.invitedBy) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: name, email, password, invitedBy' },
        { status: 400 }
      );
    }

    // 🔍 Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // 🔍 Validar longitud de contraseña
    if (body.password.length < 4) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 4 caracteres' },
        { status: 400 }
      );
    }

    // 🔒 Generar hash de la contraseña
    const passwordHash = crypto
      .createHash('sha256')
      .update(body.password)
      .digest('hex');

    // 👥 Insertar nuevo miembro en la base de datos
    const { data: newMember, error: dbError } = await supabase
      .from('team_members')
      .insert({
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: 'member',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
        permissions: [
          'files.upload',
          'files.share_links',
          'files.download',
          'files.delete_own',
          'chat.send',
          'chat.edit_own',
          'chat.delete_own',
          'team.view_members'
        ],
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error insertando miembro:', dbError);
      
      // Verificar si es error de email duplicado
      if (dbError.message?.includes('duplicate') || dbError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un miembro con ese email' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear el miembro en la base de datos' },
        { status: 500 }
      );
    }

    console.log('✅ Nuevo miembro creado en BD:', newMember);

    // 🔔 Enviar notificaciones automáticas
    let notificationResults: {
      email: { success: boolean; error: unknown };
      whatsapp: { success: boolean; error: unknown };
    } = {
      email: { success: false, error: 'No se intentó enviar' },
      whatsapp: { success: false, error: 'No se intentó enviar' }
    };

    try {
      notificationResults = await notifyNewMember({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password, // Contraseña sin hashear para las notificaciones
        invitedBy: body.invitedBy
      });

      console.log('📧 Resultados de notificaciones:', notificationResults);
    } catch (notificationError) {
      console.error('❌ Error enviando notificaciones:', notificationError);
    }

    // 📊 Preparar respuesta
    const response = {
      success: true,
      message: 'Miembro agregado exitosamente',
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        avatar_url: newMember.avatar_url,
        created_at: newMember.created_at
      },
      notifications: {
        email: {
          sent: notificationResults.email.success,
          error: notificationResults.email.success ? null : String(notificationResults.email.error)
        },
        whatsapp: {
          sent: notificationResults.whatsapp.success,
          error: notificationResults.whatsapp.success ? null : String(notificationResults.whatsapp.error),
          attempted: !!body.phone
        }
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Error en API /add-member:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// 🔍 Endpoint GET para verificar que la API funciona
export async function GET() {
  return NextResponse.json({
    message: 'API de agregar miembros funcionando',
    endpoints: {
      POST: 'Agregar nuevo miembro con notificaciones automáticas'
    },
    requiredFields: ['name', 'email', 'password', 'invitedBy'],
    optionalFields: ['phone']
  });
}