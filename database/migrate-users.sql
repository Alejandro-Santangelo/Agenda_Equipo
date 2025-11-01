-- Script de migración para insertar usuarios por defecto con contraseñas hasheadas
-- Ejecutar después de crear la tabla users en Supabase

-- IMPORTANTE: Estos hashes corresponden a las contraseñas originales:
-- Paula: 1111
-- Gabi: 3333  
-- Caro: 2222

-- Insertar Paula (Administradora)
INSERT INTO users (
  id,
  email, 
  password_hash, 
  name, 
  role, 
  phone,
  avatar_url,
  created_at,
  updated_at,
  last_active
) VALUES (
  gen_random_uuid(),
  'paula@equipo.com',
  '$2a$12$example_hash_paula_replace_with_real_hash', -- Se reemplazará con hash real
  'Paula',
  'admin',
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
);

-- Insertar Gabi (Miembro)
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  phone,
  avatar_url,
  created_at,
  updated_at,
  last_active
) VALUES (
  gen_random_uuid(),
  'gabi@equipo.com',
  '$2a$12$example_hash_gabi_replace_with_real_hash', -- Se reemplazará con hash real
  'Gabi',
  'member',
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
);

-- Insertar Caro (Miembro)
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  phone,
  avatar_url,
  created_at,
  updated_at,
  last_active
) VALUES (
  gen_random_uuid(),
  'caro@equipo.com',
  '$2a$12$example_hash_caro_replace_with_real_hash', -- Se reemplazará con hash real
  'Caro',
  'member',
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
);

-- Verificar que los usuarios se insertaron correctamente
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
ORDER BY 
  CASE 
    WHEN role = 'admin' THEN 1 
    ELSE 2 
  END,
  name;

-- Nota: Los hashes reales se generarán usando el script generate-hashes.ts