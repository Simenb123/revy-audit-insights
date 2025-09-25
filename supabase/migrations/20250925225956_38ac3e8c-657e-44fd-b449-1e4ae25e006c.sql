-- Clean up stuck import jobs and fix database conflicts (corrected version)

-- 1. Clean up stuck processing jobs (older than 1 hour) 
UPDATE import_jobs 
SET status = 'failed', 
    error = 'Job timeout - cleaned up stuck processing state'
WHERE status = 'processing' 
  AND created_at < now() - interval '1 hour';

-- 2. Remove stuck queue items
DELETE FROM shareholder_import_queue 
WHERE status = 'processing' 
  AND created_at < now() - interval '1 hour';

-- 3. Drop the conflicting process_shareholders_batch function versions
DROP FUNCTION IF EXISTS process_shareholders_batch(uuid, jsonb, integer, text);
DROP FUNCTION IF EXISTS process_shareholders_batch(uuid, jsonb, integer);
DROP FUNCTION IF EXISTS process_shareholders_batch(uuid, jsonb);

-- 4. Create the correct process_shareholders_batch function
CREATE OR REPLACE FUNCTION process_shareholders_batch(
  p_job_id bigint,
  p_mapping jsonb,
  p_year integer DEFAULT 2025,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_processed integer := 0;
  v_errors integer := 0;
  v_batch_size integer := 200;
  v_total integer := 0;
  staging_record RECORD;
BEGIN
  -- Count total staging records for this job
  SELECT COUNT(*) INTO v_total
  FROM shareholders_staging 
  WHERE job_id = p_job_id;

  -- Process staging records in batches
  FOR staging_record IN 
    SELECT * FROM shareholders_staging 
    WHERE job_id = p_job_id
    ORDER BY id
    LIMIT v_batch_size
  LOOP
    BEGIN
      -- Insert or update share company
      INSERT INTO share_companies (orgnr, name, year, user_id, total_shares)
      VALUES (
        staging_record.orgnr,
        staging_record.selskap,
        p_year,
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

      -- Insert share holding
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
        p_year,
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
    END;
  END LOOP;

  -- Clean up processed staging records
  DELETE FROM shareholders_staging 
  WHERE job_id = p_job_id
    AND id IN (
      SELECT id FROM shareholders_staging 
      WHERE job_id = p_job_id 
      ORDER BY id 
      LIMIT v_batch_size
    );

  -- Update job progress
  UPDATE import_jobs 
  SET 
    rows_loaded = COALESCE(rows_loaded, 0) + v_processed,
    status = CASE 
      WHEN (SELECT COUNT(*) FROM shareholders_staging WHERE job_id = p_job_id) = 0 THEN 'completed'
      ELSE 'processing'
    END
  WHERE id = p_job_id;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'errors', v_errors,
    'job_id', p_job_id
  );
END;
$$;