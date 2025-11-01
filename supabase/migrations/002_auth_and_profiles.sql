-- Migration 002: Authentication and User Profiles
-- Esta migración configura la autenticación y perfiles de usuario

-- Habilitar la extensión de autenticación si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para profiles
-- Los usuarios pueden ver todos los perfiles del equipo
CREATE POLICY "Team members can view all profiles" ON public.profiles
    FOR SELECT USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Solo admins pueden insertar nuevos perfiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en profiles
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'), 'member');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insertar usuarios iniciales (Paula, Gabi, Caro) si no existen
-- Nota: En producción, estos usuarios deben registrarse normalmente
-- Este es solo un script de migración para el desarrollo

-- Función temporal para crear usuarios de desarrollo
CREATE OR REPLACE FUNCTION public.create_dev_users()
RETURNS void AS $$
DECLARE
    paula_id UUID;
    gabi_id UUID;
    caro_id UUID;
BEGIN
    -- Verificar si ya existen usuarios
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'paula@equipo.com') THEN
        -- Crear Paula (admin)
        paula_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_user_meta_data
        ) VALUES (
            paula_id,
            'paula@equipo.com',
            crypt('1111', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Paula"}'::jsonb
        );
        
        INSERT INTO public.profiles (id, email, name, role) 
        VALUES (paula_id, 'paula@equipo.com', 'Paula', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'gabi@equipo.com') THEN
        -- Crear Gabi (member)
        gabi_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gabi_id,
            'gabi@equipo.com',
            crypt('3333', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Gabi"}'::jsonb
        );
        
        INSERT INTO public.profiles (id, email, name, role) 
        VALUES (gabi_id, 'gabi@equipo.com', 'Gabi', 'member');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'caro@equipo.com') THEN
        -- Crear Caro (member)
        caro_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_user_meta_data
        ) VALUES (
            caro_id,
            'caro@equipo.com',
            crypt('2222', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Caro"}'::jsonb
        );
        
        INSERT INTO public.profiles (id, email, name, role) 
        VALUES (caro_id, 'caro@equipo.com', 'Caro', 'member');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función para crear usuarios de desarrollo
SELECT public.create_dev_users();

-- Eliminar la función temporal (solo era para esta migración)
DROP FUNCTION public.create_dev_users();

-- Actualizar las políticas de las tablas existentes para usar profiles
-- Actualizar política de messages
DROP POLICY IF EXISTS "Team members can view messages" ON public.messages;
CREATE POLICY "Team members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Team members can send messages" ON public.messages;
CREATE POLICY "Team members can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) AND
        auth.uid()::text = user_id
    );

-- Actualizar política de files
DROP POLICY IF EXISTS "Team members can view files" ON public.files;
CREATE POLICY "Team members can view files" ON public.files
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Team members can upload files" ON public.files;
CREATE POLICY "Team members can upload files" ON public.files
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) AND
        auth.uid()::text = uploaded_by
    );

-- Crear vista para obtener información completa del usuario
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    p.id,
    p.email,
    p.name,
    p.phone,
    p.role,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Grant permisos para la vista
GRANT SELECT ON public.user_info TO authenticated;