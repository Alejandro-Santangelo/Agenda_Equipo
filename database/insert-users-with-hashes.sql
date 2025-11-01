-- SQL de migración completo con hashes reales
-- Ejecutar en Supabase SQL Editor después del schema.sql

-- Paula (paula@equipo.com) - Contraseña original: 1111
INSERT INTO users (
  id, email, password_hash, name, role, created_at, updated_at, last_active
) VALUES (
  gen_random_uuid(),
  'paula@equipo.com',
  '$2b$12$4gL5GHOlho4KgW8zXtBt9.BAUJfFI3PIfXCF/0XOVrq6/QUNRFrJ.',
  'Paula',
  'admin',
  NOW(),
  NOW(),
  NOW()
);

-- Gabi (gabi@equipo.com) - Contraseña original: 3333
INSERT INTO users (
  id, email, password_hash, name, role, created_at, updated_at, last_active
) VALUES (
  gen_random_uuid(),
  'gabi@equipo.com',
  '$2b$12$OYDIK5s.ZKSn4LinNj1b8.Ng5pW5IUaYF.mkTnktuuLEQfzbjlpFq',
  'Gabi',
  'member',
  NOW(),
  NOW(),
  NOW()
);

-- Caro (caro@equipo.com) - Contraseña original: 2222
INSERT INTO users (
  id, email, password_hash, name, role, created_at, updated_at, last_active
) VALUES (
  gen_random_uuid(),
  'caro@equipo.com',
  '$2b$12$b6pfm.vPiHM1d2J7j1jRkOlgR3e8oH4NGNN5PR76uUI5irLy6nFmS',
  'Caro',
  'member',
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