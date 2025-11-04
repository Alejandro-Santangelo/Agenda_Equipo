import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Verificar que Supabase esté configurado
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no está configurado',
        members: []
      }, { status: 503 })
    }

    // Obtener miembros del equipo desde Supabase
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, email, phone, role')
      .order('name')
    
    if (error) {
      console.error('Error fetching team members from Supabase:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros del equipo',
        members: []
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      members: data || []
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error al obtener miembros del equipo',
      members: []
    }, { status: 500 })
  }
}

// POST para agregar nuevos miembros (futuro)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Aquí se implementaría la lógica para agregar un nuevo miembro
    console.log('Agregando nuevo miembro:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Miembro agregado exitosamente'
    })
  } catch (error) {
    console.error('Error adding team member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error al agregar miembro del equipo'
    }, { status: 500 })
  }
}