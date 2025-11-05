-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Crear políticas públicas (sin autenticación requerida)

-- Permitir a TODOS ver archivos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-files');

-- Permitir a TODOS subir archivos
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-files');

-- Permitir a TODOS actualizar archivos
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-files');

-- Permitir a TODOS eliminar archivos
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-files');
