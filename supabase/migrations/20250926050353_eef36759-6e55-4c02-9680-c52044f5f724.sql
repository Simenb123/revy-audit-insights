-- Clean up the stuck import job using correct column names
DELETE FROM public.import_jobs WHERE id = 66 AND status = 'processing' AND rows_loaded = 0;

-- Also clear any staging data that might be stuck
DELETE FROM public.shareholders_staging WHERE user_id = 'bc484225-8b75-479c-98aa-b08e21491890';