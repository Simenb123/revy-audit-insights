-- 1) Unik indeks for entydig oppslag/UPSERT av entiteter
CREATE UNIQUE INDEX IF NOT EXISTS uq_share_entities_entity_key
  ON public.share_entities (entity_key);

-- 2) import_jobs: sørg for user_id-kolonne (hvis mangler)
ALTER TABLE public.import_jobs
ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3) RLS for import_jobs: les egne jobber
-- (forutsetter RLS er ENABLED på import_jobs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'import_jobs'
      AND policyname = 'read own jobs'
  ) THEN
    CREATE POLICY "read own jobs"
      ON public.import_jobs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;