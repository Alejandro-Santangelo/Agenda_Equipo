-- Script para configurar Supabase Storage para archivos del equipo
-- Ejecutar en Supabase SQL Editor

-- 1. Crear bucket 'team-files' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-files', 'team-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de acceso

-- Permitir a todos ver archivos (público)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-files');

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-files' AND auth.role() = 'authenticated');

-- Permitir a usuarios autenticados actualizar sus propios archivos
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-files' AND auth.role() = 'authenticated');

-- Permitir a usuarios autenticados eliminar archivos
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-files' AND auth.role() = 'authenticated');

-- 3. Verificar configuración
SELECT * FROM storage.buckets WHERE id = 'team-files';
