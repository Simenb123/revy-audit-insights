
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Create table for client documents
CREATE TABLE public.client_documents_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT,
  subject_area TEXT,
  ai_suggested_category TEXT,
  ai_confidence_score NUMERIC(3,2),
  ai_analysis_summary TEXT,
  manual_category_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_text TEXT,
  text_extraction_status TEXT DEFAULT 'pending'
);

-- Create document categories table for standard templates
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_area TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT,
  expected_file_patterns TEXT[], -- patterns like ['feriepengeliste', 'ferie', 'vacation']
  is_standard BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_area, category_name)
);

-- Insert standard document categories for salary area
INSERT INTO public.document_categories (subject_area, category_name, description, expected_file_patterns) VALUES
('lnn', 'Feriepengeliste', 'Liste over opptjente og utbetalte feriepenger', ARRAY['feriepengeliste', 'ferie', 'vacation', 'holiday']),
('lnn', 'Forskuddstrekk avstemming', 'Avstemming av forskuddstrekk og arbeidsgiveravgift', ARRAY['forskuddstrekk', 'arbeidsgiveravgift', 'aga', 'trekk']),
('lnn', 'A07 avstemming', 'Avstemming av lønnsinnberetning A07', ARRAY['a07', 'lønnsinnberetning', 'innberetning']),
('lnn', 'Kontoutskrift skatteetaten', 'Kontoutskrifter fra Skatteetaten', ARRAY['skatteetaten', 'kontoutskrift', 'utskrift']),
('lnn', 'Lønnslipper', 'Lønnslipper for ansatte', ARRAY['lønnslipper', 'lønnslipp', 'payslip']),
('lnn', 'Årsverk liste', 'Liste over antall årsverk', ARRAY['årsverk', 'ansatte', 'employee', 'fte']);

-- Add RLS policies for client documents
ALTER TABLE public.client_documents_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their clients" ON public.client_documents_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents for their clients" ON public.client_documents_files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for their clients" ON public.client_documents_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their clients" ON public.client_documents_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND user_id = auth.uid()
    )
  );

-- RLS for document categories (public read access)
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view document categories" ON public.document_categories
  FOR SELECT USING (true);

-- Storage policies for client documents
CREATE POLICY "Users can upload their client documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their client documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their client documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_client_documents_files
  BEFORE UPDATE ON public.client_documents_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
