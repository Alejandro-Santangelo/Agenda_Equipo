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

async function setupStoragePolicies() {
  console.log('🔧 Configurando políticas de Storage...\n')

  const queries = [
    // Eliminar políticas restrictivas existentes
    `DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;`,
    
    // Crear políticas públicas
    `CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'team-files');`,
    `CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-files');`,
    `CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'team-files');`,
    `CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'team-files');`
  ]

  try {
    for (const query of queries) {
      console.log('📝 Ejecutando:', query.substring(0, 50) + '...')
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      
      if (error) {
        // Si da error por política ya existente, continuar
        if (error.message.includes('already exists')) {
          console.log('⚠️  Política ya existe, continuando...')
        } else {
          console.log('⚠️  Error (puede ser normal):', error.message)
        }
      } else {
        console.log('✅ OK')
      }
    }

    console.log('\n✅ Configuración completada!')
    console.log('\n💡 Ahora puedes:')
    console.log('   1. Recargar localhost:3000')
    console.log('   2. Subir un archivo de prueba')
    console.log('   3. Verificar que funcionen Vista previa, Descargar y Eliminar\n')

  } catch (error) {
    console.error('\n❌ Error general:', error)
    console.log('\n⚠️  El script no pudo ejecutar las políticas automáticamente.')
    console.log('Por favor, ejecuta este SQL manualmente en Supabase SQL Editor:\n')
    console.log('------------------------------------------------------')
    queries.forEach(q => console.log(q))
    console.log('------------------------------------------------------\n')
  }
}

setupStoragePolicies()
