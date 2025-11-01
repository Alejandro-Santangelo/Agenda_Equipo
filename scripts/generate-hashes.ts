#!/usr/bin/env node

/**
 * Script para generar hashes de contraseñas para migración
 * Ejecutar con: npx ts-node scripts/generate-hashes.ts
 */

import { generateDefaultCredentialsHashes } from '../src/lib/password-utils.js'

async function main() {
  console.log('🔐 Generando hashes de contraseñas para migración...\n')
  
  try {
    const credentials = await generateDefaultCredentialsHashes()
    
    console.log('\n📋 SQL para insertar en Supabase:')
    console.log('=====================================\n')
    
    for (const cred of credentials) {
      console.log(`-- ${cred.name} (${cred.email})`)
      console.log(`INSERT INTO users (`)
      console.log(`  id, email, password_hash, name, role, created_at, updated_at, last_active`)
      console.log(`) VALUES (`)
      console.log(`  gen_random_uuid(),`)
      console.log(`  '${cred.email}',`)
      console.log(`  '${cred.password_hash}',`)
      console.log(`  '${cred.name}',`)
      console.log(`  '${cred.role}',`)
      console.log(`  NOW(),`)
      console.log(`  NOW(),`)
      console.log(`  NOW()`)
      console.log(`);`)
      console.log('')
    }
    
    console.log('✅ Hashes generados exitosamente!')
    console.log('\n📝 Pasos siguientes:')
    console.log('1. Ejecutar el schema.sql en Supabase SQL Editor')
    console.log('2. Copiar y ejecutar el SQL de arriba para insertar usuarios')
    console.log('3. Verificar que los usuarios se crearon correctamente')
    
  } catch (error) {
    console.error('❌ Error generando hashes:', error)
    process.exit(1)
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main()
}