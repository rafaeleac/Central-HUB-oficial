-- Criar buckets de storage para arquivos de mídia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media-files', 'media-files', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']::text[]),
  ('thumbnails', 'thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]);

-- Políticas de storage para media-files
CREATE POLICY "Usuários autenticados podem fazer upload de arquivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Arquivos de mídia são visíveis publicamente"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-files');

CREATE POLICY "Usuários autenticados podem deletar seus arquivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de storage para thumbnails
CREATE POLICY "Usuários autenticados podem fazer upload de thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Thumbnails são visíveis publicamente"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "Usuários autenticados podem deletar seus thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);