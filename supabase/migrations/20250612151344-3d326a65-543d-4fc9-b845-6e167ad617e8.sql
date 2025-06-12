
-- Create table for PDF upload and conversion tracking
CREATE TABLE public.pdf_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.knowledge_categories(id) NOT NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('full', 'summary', 'checklist')),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  extracted_text TEXT,
  structured_content JSONB,
  error_message TEXT,
  estimated_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for PDF conversions
ALTER TABLE public.pdf_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PDF conversions" 
  ON public.pdf_conversions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PDF conversions" 
  ON public.pdf_conversions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF conversions" 
  ON public.pdf_conversions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF conversions" 
  ON public.pdf_conversions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-documents', 'pdf-documents', false);

-- Storage policies for PDF documents bucket
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

-- Add trigger for updating timestamps
CREATE TRIGGER set_pdf_conversions_updated_at
  BEFORE UPDATE ON public.pdf_conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
