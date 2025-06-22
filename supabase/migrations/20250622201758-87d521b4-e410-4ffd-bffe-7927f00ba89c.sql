
-- Create the client-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents', 
  'client-documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete client documents" ON storage.objects;

-- Create storage policies for client-documents bucket
CREATE POLICY "Users can upload client documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'client-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view client documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'client-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update client documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'client-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete client documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'client-documents' AND
    auth.uid() IS NOT NULL
  );
