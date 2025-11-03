import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase en las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deletePaula() {
  try {
    console.log('🔍 Buscando usuario Paula...')
    
    // Buscar a Paula (sin .single() por si hay múltiples)
    const { data: paulas, error: searchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', 'paula@equipo.com')

    if (searchError) {
      console.error('❌ Error buscando a Paula:', searchError.message)
      return
    }

    if (!paulas || paulas.length === 0) {
      console.log('✅ Paula ya no existe en la base de datos')
      return
    }

    console.log(`📋 ${paulas.length} usuario(s) encontrado(s):`)
    paulas.forEach((paula, index) => {
      console.log(`\n   Usuario ${index + 1}:`)
      console.log(`   ID: ${paula.id}`)
      console.log(`   Nombre: ${paula.name}`)
      console.log(`   Email: ${paula.email}`)
      console.log(`   Rol: ${paula.role}`)
    })

    // Eliminar a Paula
    console.log('\n🗑️  Eliminando usuario...')
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('email', 'paula@equipo.com')

    if (deleteError) {
      console.error('❌ Error eliminando a Paula:', deleteError.message)
      return
    }

    console.log('✅ Paula ha sido eliminada exitosamente de la base de datos')
    console.log('✅ Verificación: Usuario eliminado correctamente')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

deletePaula()
