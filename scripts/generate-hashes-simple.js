/**
 * Script simple para generar hashes de contraseñas
 * Ejecutar con: node scripts/generate-hashes-simple.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Error al procesar la contraseña');
  }
}

async function generateHashes() {
  console.log('🔐 Generando hashes de contraseñas para migración...\n');
  
  const credentials = [
    { email: 'paula@equipo.com', password: '1111', name: 'Paula', role: 'admin' },
    { email: 'gabi@equipo.com', password: '3333', name: 'Gabi', role: 'member' },
    { email: 'caro@equipo.com', password: '2222', name: 'Caro', role: 'member' }
  ];

  console.log('📋 SQL para insertar en Supabase:');
  console.log('=====================================\n');
  
  for (const cred of credentials) {
    const hash = await hashPassword(cred.password);
    
    console.log(`-- ${cred.name} (${cred.email}) - Contraseña original: ${cred.password}`);
    console.log(`INSERT INTO users (`);
    console.log(`  id, email, password_hash, name, role, created_at, updated_at, last_active`);
    console.log(`) VALUES (`);
    console.log(`  gen_random_uuid(),`);
    console.log(`  '${cred.email}',`);
    console.log(`  '${hash}',`);
    console.log(`  '${cred.name}',`);
    console.log(`  '${cred.role}',`);
    console.log(`  NOW(),`);
    console.log(`  NOW(),`);
    console.log(`  NOW()`);
    console.log(`);`);
    console.log('');
  }
  
  console.log('✅ Hashes generados exitosamente!');
  console.log('\n📝 Pasos siguientes:');
  console.log('1. Ejecutar el schema.sql en Supabase SQL Editor');
  console.log('2. Copiar y ejecutar el SQL de arriba para insertar usuarios');
  console.log('3. Verificar que los usuarios se crearon correctamente');
}

generateHashes().catch(console.error);