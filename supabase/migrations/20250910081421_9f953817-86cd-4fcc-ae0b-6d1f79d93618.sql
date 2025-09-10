-- Update storage bucket settings to allow larger files
-- Set maximum file size to 50MB for imports bucket (free tier limit)
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'imports';

-- Create imports bucket if it doesn't exist with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('imports', 'imports', false, 52428800, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure proper RLS policies for imports bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to imports bucket"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'imports' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can view their own uploads in imports bucket"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'imports' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can delete their own uploads in imports bucket"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'imports' 
  AND auth.role() = 'authenticated'
);