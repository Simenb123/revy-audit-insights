-- Enable realtime for import_jobs table
ALTER TABLE public.import_jobs REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.import_jobs;