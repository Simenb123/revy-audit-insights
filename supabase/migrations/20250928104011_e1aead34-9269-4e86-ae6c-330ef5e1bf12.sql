-- Manually set file_streamed=true for job 78 to test the completion logic
UPDATE shareholder_import_queue 
SET file_streamed = true 
WHERE job_id = 78;