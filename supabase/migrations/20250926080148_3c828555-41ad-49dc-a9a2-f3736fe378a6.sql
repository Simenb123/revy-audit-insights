-- Phase A: Critical fixes for shareholder import

-- 1. Clean up stuck jobs
DELETE FROM public.import_jobs WHERE id IN (67, 65) AND status = 'processing' AND rows_loaded = 0;
DELETE FROM public.shareholder_import_queue WHERE job_id IN (67, 65);
DELETE FROM public.shareholders_staging WHERE user_id = 'bc484225-8b75-479c-98aa-b08e21491890';

-- 2. Add job_id column to shareholders_staging if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shareholders_staging' 
                   AND column_name = 'job_id') THEN
        ALTER TABLE public.shareholders_staging ADD COLUMN job_id BIGINT;
        CREATE INDEX IF NOT EXISTS idx_shareholders_staging_job_id ON public.shareholders_staging(job_id);
    END IF;
END $$;

-- 3. Drop conflicting function signatures and create single correct version
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, jsonb, integer, uuid);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, jsonb, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, jsonb);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, jsonb, integer, text);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, jsonb, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, jsonb);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, uuid, integer, integer);

-- 4. Create the correct single process_shareholders_batch function
CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
  p_job_id bigint, 
  p_user_id uuid, 
  p_offset integer DEFAULT 0, 
  p_limit integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_processed integer := 0;
  v_errors integer := 0;
  v_total integer := 0;
  staging_record RECORD;
  v_year integer := 2025; -- Default year
BEGIN
  -- Count total staging records for this user (since we process all at once)
  SELECT COUNT(*) INTO v_total
  FROM shareholders_staging 
  WHERE user_id = p_user_id;

  -- Process ALL staging records for this user (not filtered by offset/id)
  -- Since edge function clears staging after each chunk, this processes current chunk
  FOR staging_record IN 
    SELECT * FROM shareholders_staging 
    WHERE user_id = p_user_id
    ORDER BY id
  LOOP
    BEGIN
      -- Insert or update share company
      INSERT INTO share_companies (orgnr, name, year, user_id, total_shares)
      VALUES (
        staging_record.orgnr,
        staging_record.selskap,
        v_year,
        p_user_id,
        0
      )
      ON CONFLICT (orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
      DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = now();

      -- Insert or update share entity
      INSERT INTO share_entities (
        entity_type,
        name,
        orgnr,
        birth_year,
        country_code,
        user_id
      )
      VALUES (
        CASE 
          WHEN staging_record.fodselsaar_orgnr ~ '^\d{9}$' THEN 'company'
          ELSE 'person'
        END,
        staging_record.navn_aksjonaer,
        CASE 
          WHEN staging_record.fodselsaar_orgnr ~ '^\d{9}$' THEN staging_record.fodselsaar_orgnr
          ELSE NULL
        END,
        CASE 
          WHEN staging_record.fodselsaar_orgnr ~ '^\d{4}$' THEN staging_record.fodselsaar_orgnr::integer
          ELSE NULL
        END,
        COALESCE(staging_record.landkode, 'NO'),
        p_user_id
      )
      ON CONFLICT (
        entity_type,
        name,
        COALESCE(orgnr, ''),
        COALESCE(birth_year, 0),
        COALESCE(user_id, '00000000-0000-0000-0000-000000000000')
      )
      DO UPDATE SET 
        country_code = EXCLUDED.country_code,
        updated_at = now();

      -- Insert share holding using holder_id from the entity we just created/updated
      INSERT INTO share_holdings (
        company_orgnr,
        holder_id,
        share_class,
        shares,
        year,
        user_id
      )
      SELECT 
        staging_record.orgnr,
        se.id,
        staging_record.aksjeklasse,
        staging_record.antall_aksjer,
        v_year,
        p_user_id
      FROM share_entities se
      WHERE se.name = staging_record.navn_aksjonaer
        AND se.entity_type = CASE 
          WHEN staging_record.fodselsaar_orgnr ~ '^\d{9}$' THEN 'company'
          ELSE 'person'
        END
        AND (se.user_id = p_user_id OR se.user_id IS NULL)
      LIMIT 1
      ON CONFLICT (company_orgnr, holder_id, share_class, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
      DO UPDATE SET 
        shares = EXCLUDED.shares,
        updated_at = now();

      v_processed := v_processed + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error processing staging record %: %', staging_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  -- DO NOT delete staging here - let edge function handle it to avoid double deletion

  RETURN jsonb_build_object(
    'processed_count', v_processed,
    'errors_count', v_errors,
    'total_found', v_total
  );
END;
$$;