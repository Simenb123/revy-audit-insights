
-- Create storage bucket for PDF documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-documents', 
  'pdf-documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can upload their own PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDF files" ON storage.objects;

-- Create RLS policies for PDF documents storage
CREATE POLICY "Users can upload their own PDF files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDF files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdf-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own PDF files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'pdf-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDF files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pdf-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add constraint to pdf_conversions table for valid conversion types
ALTER TABLE public.pdf_conversions 
DROP CONSTRAINT IF EXISTS pdf_conversions_conversion_type_check;

ALTER TABLE public.pdf_conversions 
ADD CONSTRAINT pdf_conversions_conversion_type_check 
CHECK (conversion_type IN ('full', 'summary', 'checklist'));

-- Add constraint for valid status values
ALTER TABLE public.pdf_conversions 
DROP CONSTRAINT IF EXISTS pdf_conversions_status_check;

ALTER TABLE public.pdf_conversions 
ADD CONSTRAINT pdf_conversions_status_check 
CHECK (status IN ('uploading', 'processing', 'completed', 'failed'));
