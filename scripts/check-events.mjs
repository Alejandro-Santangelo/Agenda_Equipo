import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(' Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEvents() {
  console.log('\n Verificando eventos en Supabase...\n')
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(' Error:', error.message)
    return
  }
  
  console.log(` Total de eventos: ${events.length}\n`)
  
  if (events.length > 0) {
    console.log(' Eventos encontrados:\n')
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`)
      console.log(`   Tipo: ${event.event_type}`)
      console.log(`   Fecha inicio: ${event.start_date}`)
      console.log(`   Creado: ${event.created_at}`)
      console.log('')
    })
  } else {
    console.log('ℹ No hay eventos en la base de datos')
  }
  
  // Verificar historial de actividad
  const { data: activities, error: actError } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_type', 'event')
    .order('created_at', { ascending: false })
  
  if (!actError && activities) {
    console.log(`\n Actividades registradas sobre eventos: ${activities.length}`)
    console.log('(Esto incluye creaciones, ediciones y eliminaciones)\n')
  }
}

checkEvents()
