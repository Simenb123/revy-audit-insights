-- Create unique constraint on job_id in shareholder_import_queue and add foreign key relationship

-- First, add unique constraint to job_id in shareholder_import_queue
ALTER TABLE public.shareholder_import_queue 
ADD CONSTRAINT uk_shareholder_import_queue_job_id UNIQUE (job_id);

-- Then add foreign key constraint from shareholders_staging to shareholder_import_queue
ALTER TABLE public.shareholders_staging 
ADD CONSTRAINT fk_shareholders_staging_job_id 
FOREIGN KEY (job_id) 
REFERENCES public.shareholder_import_queue(job_id);