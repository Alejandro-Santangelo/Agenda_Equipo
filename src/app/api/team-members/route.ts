import { NextResponse } from 'next/server'

// Datos de ejemplo del equipo
const TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Paula',
    email: 'paula@equipo.com',
    phone: '+54 9 11 1111-1111',
    role: 'admin'
  },
  {
    id: '2', 
    name: 'Gabi',
    email: 'gabi@equipo.com',
    phone: '+54 9 11 3333-3333',
    role: 'member'
  },
  {
    id: '3',
    name: 'Caro', 
    email: 'caro@equipo.com',
    phone: '+54 9 11 2222-2222',
    role: 'member'
  }
]

export async function GET() {
  try {
    // En una implementación real, esto vendría de Supabase
    // const { data, error } = await supabase
    //   .from('team_members')
    //   .select('id, name, email, phone, role')
    //   .order('name')
    
    // Por ahora, devolvemos datos de ejemplo
    return NextResponse.json({
      success: true,
      members: TEAM_MEMBERS
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error al obtener miembros del equipo',
      members: TEAM_MEMBERS // Fallback a datos de ejemplo
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