import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableSchema() {
  try {
    console.log('🔍 Verificando estructura de la tabla team_members...\n')
    
    // Intentar obtener un registro para ver las columnas disponibles
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Error:', error.message)
      return
    }

    if (data) {
      console.log('📋 Columnas disponibles en team_members:')
      console.log(Object.keys(data))
      console.log('\n📝 Ejemplo de registro:')
      console.log(data)
    } else {
      console.log('⚠️  La tabla está vacía, no se puede determinar la estructura')
      console.log('ℹ️  Intenta obtener el schema desde Supabase Dashboard')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkTableSchema()
