import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllMembers() {
  try {
    console.log('📋 Listando todos los miembros en Supabase...\n')
    
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (!members || members.length === 0) {
      console.log('⚠️  No hay miembros en la base de datos')
      return
    }

    console.log(`✅ Total de miembros: ${members.length}\n`)
    
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name}`)
      console.log(`   Email: ${member.email}`)
      console.log(`   ID: ${member.id}`)
      console.log(`   Rol: ${member.role}`)
      console.log(`   Creado: ${new Date(member.created_at).toLocaleString()}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

listAllMembers()
