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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanAllFiles() {
  console.log('🧹 Limpiando todos los archivos...\n')

  try {
    // 1. Ver archivos en shared_files
    console.log('📋 Archivos en base de datos:')
    const { data: files, error: filesError } = await supabase
      .from('shared_files')
      .select('*')

    if (filesError) {
      console.error('❌ Error al consultar archivos:', filesError)
      return
    }

    console.log(`   Total: ${files?.length || 0} archivos\n`)
    files?.forEach(file => {
      console.log(`   - ${file.name} (ID: ${file.id})`)
      console.log(`     URL: ${file.url}`)
    })

    // 2. Eliminar registros de shared_files
    if (files && files.length > 0) {
      console.log('\n🗑️  Eliminando registros de shared_files...')
      const { error: deleteDbError } = await supabase
        .from('shared_files')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

      if (deleteDbError) {
        console.error('❌ Error al eliminar de DB:', deleteDbError)
      } else {
        console.log('✅ Registros eliminados de base de datos')
      }
    }

    // 3. Listar archivos en Storage
    console.log('\n📦 Archivos en Storage:')
    const { data: storageFiles, error: storageListError } = await supabase
      .storage
      .from('team-files')
      .list('', { limit: 100, offset: 0 })

    if (storageListError) {
      console.error('❌ Error al listar Storage:', storageListError)
    } else {
      console.log(`   Total: ${storageFiles?.length || 0} archivos\n`)
      
      // Listar recursivamente todas las carpetas
      for (const item of storageFiles || []) {
        if (item.name) {
          console.log(`   - ${item.name}`)
          
          // Si es una carpeta (no tiene metadata), listar su contenido
          if (!item.metadata) {
            const { data: subFiles } = await supabase
              .storage
              .from('team-files')
              .list(item.name)
            
            if (subFiles) {
              subFiles.forEach(subFile => {
                console.log(`     └─ ${subFile.name}`)
              })
            }
          }
        }
      }
    }

    // 4. Eliminar todos los archivos de Storage
    console.log('\n🗑️  Eliminando archivos de Storage...')
    
    // Eliminar archivos en cada carpeta de usuario
    for (const item of storageFiles || []) {
      if (item.name && !item.metadata) { // Es una carpeta
        const { data: subFiles } = await supabase
          .storage
          .from('team-files')
          .list(item.name)
        
        if (subFiles && subFiles.length > 0) {
          const filePaths = subFiles.map(f => `${item.name}/${f.name}`)
          const { error: deleteStorageError } = await supabase
            .storage
            .from('team-files')
            .remove(filePaths)
          
          if (deleteStorageError) {
            console.error(`❌ Error al eliminar archivos de ${item.name}:`, deleteStorageError)
          } else {
            console.log(`✅ Eliminados ${filePaths.length} archivos de ${item.name}`)
          }
        }
      }
    }

    // 5. Eliminar actividades de archivos
    console.log('\n🗑️  Eliminando actividades de archivos...')
    const { error: deleteActivitiesError } = await supabase
      .from('activity_log')
      .delete()
      .eq('entity_type', 'file')

    if (deleteActivitiesError) {
      console.error('❌ Error al eliminar actividades:', deleteActivitiesError)
    } else {
      console.log('✅ Actividades eliminadas')
    }

    console.log('\n✅ Limpieza completada! 🎉')
    console.log('\n💡 Ahora puedes:')
    console.log('   1. Ejecutar localStorage.clear() en la consola del navegador')
    console.log('   2. Recargar la página con Ctrl+Shift+R')
    console.log('   3. Subir un archivo nuevo')
    console.log('   4. Verificar que se guarde con UUID real')
    console.log('   5. Intentar eliminarlo\n')

  } catch (error) {
    console.error('\n❌ Error general:', error)
  }
}

cleanAllFiles()
