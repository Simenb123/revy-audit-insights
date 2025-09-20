-- Fix the NULL user_id issue in shareholders_staging
UPDATE shareholders_staging 
SET user_id = 'bc484225-8b75-479c-98aa-b08e21491890'
WHERE user_id IS NULL;

-- Reset stalled jobs to allow reprocessing (removing references to non-existent columns)
UPDATE import_jobs 
SET status = 'queued', rows_loaded = 0, error = NULL
WHERE id IN (34, 35, 36) AND status = 'processing';

UPDATE shareholder_import_queue 
SET status = 'pending', processed_at = NULL, error_message = NULL
WHERE job_id IN (34, 35, 36) AND status != 'pending';

-- Add logging column to track user_id issues in future imports
ALTER TABLE shareholders_staging 
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_shareholders_staging_user_id ON shareholders_staging(user_id) WHERE user_id IS NOT NULL;