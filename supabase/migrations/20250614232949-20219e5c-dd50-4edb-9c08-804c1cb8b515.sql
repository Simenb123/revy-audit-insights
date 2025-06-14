
ALTER TABLE public.pdf_documents
ADD COLUMN nrs_number TEXT NULL;

COMMENT ON COLUMN public.pdf_documents.nrs_number IS 'Stores the NRS (Norsk Regnskapsstandard) number if applicable.';
