
-- 1) Opprett enum for type oppdrag
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engagement_type') THEN
    CREATE TYPE public.engagement_type AS ENUM ('revisjon', 'regnskap', 'annet');
  END IF;
END$$;

-- 2) Legg til kolonnen i clients-tabellen hvis den ikke finnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clients'
      AND column_name = 'engagement_type'
  ) THEN
    ALTER TABLE public.clients
      ADD COLUMN engagement_type public.engagement_type NULL;
  END IF;
END$$;
