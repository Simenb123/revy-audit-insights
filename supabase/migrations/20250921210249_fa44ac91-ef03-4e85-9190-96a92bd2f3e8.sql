-- Reset stuck jobs in import_jobs table
UPDATE import_jobs 
SET 
  status = 'pending',
  error = NULL,
  rows_loaded = 0,
  updated_at = now()
WHERE status IN ('processing', 'failed');

-- Also clear any stuck entries in the import queue  
DELETE FROM shareholder_import_queue 
WHERE created_at < now() - interval '1 hour';