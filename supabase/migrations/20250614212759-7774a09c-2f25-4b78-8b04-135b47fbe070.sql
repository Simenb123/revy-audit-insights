
-- Add a column to store extracted text as structured JSON
ALTER TABLE public.pdf_documents
ADD COLUMN extracted_text JSONB NULL;

COMMENT ON COLUMN public.pdf_documents.extracted_text IS 'Stores structured text extracted from the PDF, page by page.';

-- Add a column to track the status of the text extraction process
ALTER TABLE public.pdf_documents
ADD COLUMN text_extraction_status TEXT NULL DEFAULT 'pending';

COMMENT ON COLUMN public.pdf_documents.text_extraction_status IS 'Tracks the status of text extraction: pending, processing, completed, failed.';

-- Ensure the existing policy allows updating these new columns by users.
-- The current policy is sufficient, but we will re-apply it for clarity.
DROP POLICY IF EXISTS "Users can update their own PDF documents" ON public.pdf_documents;

CREATE POLICY "Users can update their own PDF documents"
  ON public.pdf_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

