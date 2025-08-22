-- Create table for storing company cases in PDF Creator
CREATE TABLE public.pdf_creator_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  org_number TEXT,
  address TEXT,
  is_vat_registered BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_creator_companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own PDF companies" 
ON public.pdf_creator_companies 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pdf_creator_companies_updated_at
BEFORE UPDATE ON public.pdf_creator_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();