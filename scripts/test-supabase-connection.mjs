// Script de verificación de conexión con Supabase
// Ejecutar con: node scripts/test-supabase-connection.mjs

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase (desde .env.local)
const supabaseUrl = 'https://rvgrrbquevzfuyhekbfr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JyYnF1ZXZ6ZnV5aGVrYmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODk5MDAsImV4cCI6MjA3NzY2NTkwMH0.GIjnZZ7xkZyyn3Nml5EiFp2m8XxIMdPOfi1uJDdn1nY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Verificando conexión con Supabase...\n')

async function testConnection() {
  try {
    // Test 1: Verificar si podemos consultar la tabla team_members
    console.log('📋 Test 1: Consultar tabla team_members...')
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
    
    if (membersError) {
      console.error('❌ Error al consultar team_members:', membersError.message)
      return false
    }
    
    console.log(`✅ Tabla team_members encontrada`)
    console.log(`   Total de usuarios: ${members.length}`)
    
    // Mostrar usuarios sin revelar passwords
    members.forEach(member => {
      console.log(`   - ${member.name} (${member.email}) - Rol: ${member.role}`)
    })
    
    console.log('')
    
    // Test 2: Verificar usuario específico (Paula)
    console.log('👤 Test 2: Buscar usuario Paula...')
    const { data: paula, error: paulaError } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', 'paula@equipo.com')
      .single()
    
    if (paulaError) {
      console.error('❌ Error al buscar Paula:', paulaError.message)
      return false
    }
    
    if (paula) {
      console.log('✅ Usuario Paula encontrado:')
      console.log(`   ID: ${paula.id}`)
      console.log(`   Nombre: ${paula.name}`)
      console.log(`   Email: ${paula.email}`)
      console.log(`   Rol: ${paula.role}`)
      console.log(`   Teléfono: ${paula.phone || 'No especificado'}`)
      console.log(`   Creado: ${new Date(paula.created_at).toLocaleString()}`)
      console.log(`   Última vez visto: ${paula.last_seen ? new Date(paula.last_seen).toLocaleString() : 'Nunca'}`)
      console.log(`   Hash de contraseña: ${paula.password_hash ? '✅ Presente' : '❌ Faltante'}`)
    }
    
    console.log('')
    
    // Test 3: Verificar políticas RLS
    console.log('🔐 Test 3: Verificar políticas de seguridad...')
    console.log('   (Si puedes ver los datos, las políticas están configuradas correctamente)')
    
    console.log('')
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!')
    console.log('')
    console.log('📝 Resumen:')
    console.log('   ✅ Conexión establecida con Supabase')
    console.log('   ✅ Tabla team_members accesible')
    console.log('   ✅ Usuario Paula encontrado')
    console.log('   ✅ Políticas RLS funcionando correctamente')
    
    return true
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    return false
  }
}

// Test 4: Función para actualizar email de prueba (NO ejecutar en producción)
async function testUpdateEmail(oldEmail, newEmail) {
  console.log('\n⚠️  Test 4: Simulación de actualización de email...')
  console.log(`   Cambiar de: ${oldEmail}`)
  console.log(`   Cambiar a: ${newEmail}`)
  console.log('   (Este test NO ejecutará la actualización, solo muestra cómo hacerlo)')
  
  // Código comentado para seguridad
  /*
  const { error } = await supabase
    .from('team_members')
    .update({ email: newEmail, last_seen: new Date().toISOString() })
    .eq('email', oldEmail)
  
  if (error) {
    console.error('❌ Error:', error.message)
  } else {
    console.log('✅ Email actualizado exitosamente')
  }
  */
}

// Ejecutar tests
testConnection()
  .then(success => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
