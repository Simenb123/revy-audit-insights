-- Reset job 35 back to pending status for reprocessing
UPDATE import_jobs 
SET status = 'queued', rows_loaded = 0, error = NULL
WHERE id = 35;

UPDATE shareholder_import_queue 
SET status = 'pending', processed_at = NULL, error_message = NULL
WHERE job_id = 35;