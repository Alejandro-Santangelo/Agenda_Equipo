-- 🚀 COPIA ESTE SQL COMPLETO Y PÉGALO EN SUPABASE SQL EDITOR

-- Crear tabla de miembros
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Crear tabla de archivos
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upload', 'link')),
  file_type TEXT,
  url TEXT,
  size_bytes BIGINT,
  shared_by UUID REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  download_count INTEGER DEFAULT 0
);

-- Crear tabla de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  message_type TEXT DEFAULT 'text'
);

-- Insertar usuarios (Paula, Gabi, Caro)
INSERT INTO team_members (name, email, password_hash, role, avatar_url, permissions) 
VALUES 
('Paula', 'paula@equipo.com', '0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paula', ARRAY['admin']),
('Gabi', 'gabi@equipo.com', '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', 'member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabi', ARRAY['member']),
('Caro', 'caro@equipo.com', 'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', 'member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caro', ARRAY['member'])
ON CONFLICT (email) DO NOTHING;

-- Mensaje inicial
INSERT INTO chat_messages (message, sent_by) 
SELECT '¡Bienvenidas a la Agenda Colaborativa! 🎉', id FROM team_members WHERE email = 'paula@equipo.com';

-- Habilitar acceso público (para colaboración)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON team_members FOR ALL USING (true);
CREATE POLICY "allow_all" ON shared_files FOR ALL USING (true);  
CREATE POLICY "allow_all" ON chat_messages FOR ALL USING (true);