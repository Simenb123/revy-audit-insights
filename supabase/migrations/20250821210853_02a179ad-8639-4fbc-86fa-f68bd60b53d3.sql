-- Fix legal_provisions table structure to match upload code expectations

-- Add missing provision_id column that the upload code expects
ALTER TABLE public.legal_provisions 
ADD COLUMN IF NOT EXISTS provision_id TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_legal_provisions_provision_id 
ON public.legal_provisions(provision_id);

-- Also add index on law_identifier for better query performance
CREATE INDEX IF NOT EXISTS idx_legal_provisions_law_identifier 
ON public.legal_provisions(law_identifier);