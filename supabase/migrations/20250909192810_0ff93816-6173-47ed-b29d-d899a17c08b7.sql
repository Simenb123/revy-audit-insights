-- Legg til RLS policy for import_jobs (user_id kolonne eksisterer allerede)
DROP POLICY IF EXISTS "read own jobs" ON public.import_jobs;

CREATE POLICY "read own jobs"
  ON public.import_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);