import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Leer variables de entorno desde .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envLines = envContent.split('\n')
const env = {}
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseKey ? 'Presente' : 'Ausente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanTempFiles() {
  console.log('🧹 Iniciando limpieza de archivos temporales...\n')

  try {
    // 1. Buscar actividades de archivos con IDs temporales
    console.log('🔍 Buscando actividades con IDs temporales...')
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', 'file')
      .like('entity_id', 'file-%')

    if (activitiesError) {
      console.error('❌ Error al buscar actividades:', activitiesError)
      return
    }

    console.log(`📋 Encontradas ${activities?.length || 0} actividades con IDs temporales\n`)

    if (activities && activities.length > 0) {
      console.log('Archivos a limpiar:')
      activities.forEach(act => {
        console.log(`  - ${act.entity_name} (ID: ${act.entity_id})`)
      })

      // 2. Eliminar estas actividades
      console.log('\n🗑️ Eliminando actividades...')
      const { error: deleteError } = await supabase
        .from('activity_log')
        .delete()
        .eq('entity_type', 'file')
        .like('entity_id', 'file-%')

      if (deleteError) {
        console.error('❌ Error al eliminar actividades:', deleteError)
        return
      }

      console.log('✅ Actividades eliminadas correctamente')
    }

    // 3. Verificar archivos en shared_files (debería estar vacío o solo con UUIDs)
    console.log('\n🔍 Verificando tabla shared_files...')
    const { data: sharedFiles, error: filesError } = await supabase
      .from('shared_files')
      .select('*')

    if (filesError) {
      console.error('❌ Error al consultar shared_files:', filesError)
      return
    }

    console.log(`📄 Archivos válidos en shared_files: ${sharedFiles?.length || 0}`)
    if (sharedFiles && sharedFiles.length > 0) {
      sharedFiles.forEach(file => {
        console.log(`  - ${file.name} (UUID: ${file.id})`)
      })
    }

    console.log('\n✅ Limpieza completada exitosamente! 🎉')
    console.log('\n💡 Ahora puedes:')
    console.log('   1. Refrescar la página con Ctrl+Shift+R')
    console.log('   2. Ejecutar localStorage.clear() en la consola del navegador')
    console.log('   3. Recargar de nuevo')
    console.log('   4. Subir un nuevo archivo\n')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

cleanTempFiles()
