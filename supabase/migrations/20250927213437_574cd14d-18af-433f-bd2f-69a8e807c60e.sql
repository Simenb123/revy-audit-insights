-- Add file_streamed column to shareholder_import_queue
ALTER TABLE public.shareholder_import_queue 
ADD COLUMN IF NOT EXISTS file_streamed boolean DEFAULT false;