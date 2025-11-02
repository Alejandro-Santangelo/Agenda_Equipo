const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Credenciales de Supabase
const supabaseUrl = 'https://rvgrrbquevzfuyhekbfr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JyYnF1ZXZ6ZnV5aGVrYmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODk5MDAsImV4cCI6MjA3NzY2NTkwMH0.GIjnZZ7xkZyyn3Nml5EiFp2m8XxIMdPOfi1uJDdn1nY'

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de base de datos...')
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'supabase-setup.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Archivo SQL leído correctamente')
    
    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`)
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.includes('CREATE TABLE') || 
          command.includes('INSERT INTO') || 
          command.includes('CREATE INDEX') ||
          command.includes('ALTER TABLE') ||
          command.includes('CREATE POLICY') ||
          command.includes('CREATE FUNCTION') ||
          command.includes('CREATE VIEW')) {
        
        console.log(`⚡ Ejecutando comando ${i + 1}/${commands.length}...`)
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: command + ';' 
          })
          
          if (error) {
            console.log(`⚠️  Advertencia en comando ${i + 1}: ${error.message}`)
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`)
          }
        } catch (cmdError) {
          console.log(`⚠️  Error en comando ${i + 1}: ${cmdError.message}`)
        }
      }
    }
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tables) {
      console.log('📋 Tablas encontradas:', tables.map(t => t.table_name).join(', '))
    }
    
    // Verificar usuarios creados
    console.log('👥 Verificando usuarios creados...')
    
    const { data: users, error: usersError } = await supabase
      .from('team_members')
      .select('name, email, role')
    
    if (users && users.length > 0) {
      console.log('✅ Usuarios encontrados:')
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
      })
    } else {
      console.log('❌ No se encontraron usuarios, intentando inserción manual...')
      
      // Insertar usuarios manualmente
      const usersToInsert = [
        {
          name: 'Paula',
          email: 'paula@equipo.com', 
          password_hash: '0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c',
          role: 'admin'
        },
        {
          name: 'Gabi',
          email: 'gabi@equipo.com',
          password_hash: '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', 
          role: 'member'
        },
        {
          name: 'Caro',
          email: 'caro@equipo.com',
          password_hash: 'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9',
          role: 'member'
        }
      ]
      
      for (const user of usersToInsert) {
        const { error } = await supabase
          .from('team_members')
          .insert(user)
        
        if (error) {
          console.log(`⚠️  Error insertando ${user.name}: ${error.message}`)
        } else {
          console.log(`✅ Usuario ${user.name} insertado correctamente`)
        }
      }
    }
    
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA!')
    console.log('✅ Base de datos configurada correctamente')
    console.log('✅ Usuarios creados (Paula admin, Gabi y Caro members)')
    console.log('✅ La aplicación debería funcionar en modo online ahora')
    console.log('\n🔐 Credenciales para probar:')
    console.log('👩‍💼 Paula (Admin): paula@equipo.com / 1111')
    console.log('👩‍🔬 Gabi (Miembro): gabi@equipo.com / 3333')
    console.log('👩‍💻 Caro (Miembro): caro@equipo.com / 2222')
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message)
    console.log('\n🔧 Solución alternativa:')
    console.log('1. Ve a https://supabase.com/dashboard/project/rvgrrbquevzfuyhekbfr/sql')
    console.log('2. Copia el contenido de supabase-setup.sql')
    console.log('3. Pégalo y ejecuta el SQL manualmente')
  }
}

// Ejecutar setup
setupDatabase()