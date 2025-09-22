-- Remove duplicate shareholders_import_queue table (plural)
-- Keep only shareholder_import_queue (singular) which is actively used by the edge functions
DROP TABLE IF EXISTS public.shareholders_import_queue;