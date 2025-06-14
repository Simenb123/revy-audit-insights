
-- Create the table to store PDF document metadata
CREATE TABLE public.pdf_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  isa_number TEXT,
  tags TEXT[],
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.pdf_documents IS 'Stores metadata for user-uploaded PDF documents.';
COMMENT ON COLUMN public.pdf_documents.is_favorite IS 'Whether the user has marked the document as a favorite.';
COMMENT ON COLUMN public.pdf_documents.tags IS 'Array of tags for categorization and search.';

-- Enable Row Level Security
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the pdf_documents table
CREATE POLICY "Users can view their own PDF documents"
  ON public.pdf_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF documents"
  ON public.pdf_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF documents"
  ON public.pdf_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF documents"
  ON public.pdf_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER set_pdf_documents_updated_at BEFORE UPDATE ON public.pdf_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create storage bucket for PDF documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-documents', 'pdf-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Allow public read access to pdf documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdf-documents');

CREATE POLICY "Allow authenticated users to upload pdf documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdf-documents');

CREATE POLICY "Allow users to update their own pdf documents"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (bucket_id = 'pdf-documents');

CREATE POLICY "Allow users to delete their own pdf documents"
ON storage.objects FOR DELETE
USING (auth.uid() = owner);

