-- First, drop ALL existing versions of process_shareholders_batch function
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_user_id text, p_year integer, p_batch_size integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id uuid, p_batch_size integer, p_max_errors integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id uuid, p_limit integer, p_offset integer, p_user_id text);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_batch_size integer, p_user_id text, p_year integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id integer, p_limit integer, p_offset integer, p_user_id text);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id bigint, p_limit integer, p_offset integer, p_user_id text);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id bigint, p_user_id uuid, p_offset integer, p_limit integer);

-- Add job_id column to shareholders_staging table if not exists
ALTER TABLE public.shareholders_staging 
ADD COLUMN IF NOT EXISTS job_id bigint;

-- Create index for efficient queries by job_id
CREATE INDEX IF NOT EXISTS idx_shareholders_staging_job_id ON public.shareholders_staging(job_id);

-- Create the ONLY version of process_shareholders_batch function with correct signature
CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
  p_job_id bigint,
  p_user_id uuid DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time timestamp := clock_timestamp();
  v_processed_count integer := 0;
  v_error_count integer := 0;
  v_total_found integer := 0;
  v_staging_record RECORD;
  v_company_id uuid;
  v_entity_id uuid;
  v_holding_id uuid;
  v_shares_int integer;
  v_orgnr_clean text;
  v_birth_year_int integer;
  v_country_code text;
  v_entity_type text;
BEGIN
  -- Count total records to process for this job
  SELECT COUNT(*) INTO v_total_found 
  FROM public.shareholders_staging 
  WHERE job_id = p_job_id;
  
  RAISE NOTICE 'Processing batch for job_id: %, offset: %, limit: %, total_found: %', 
    p_job_id, p_offset, p_limit, v_total_found;

  -- Process staging records in batch with job_id filter
  FOR v_staging_record IN 
    SELECT * FROM public.shareholders_staging 
    WHERE job_id = p_job_id
    ORDER BY id 
    LIMIT p_limit OFFSET p_offset
  LOOP
    BEGIN
      -- Clean and validate orgnr
      v_orgnr_clean := REGEXP_REPLACE(TRIM(v_staging_record.orgnr), '[^0-9]', '', 'g');
      
      IF LENGTH(v_orgnr_clean) != 9 THEN
        v_error_count := v_error_count + 1;
        CONTINUE;
      END IF;

      -- Parse shares as integer
      v_shares_int := COALESCE(v_staging_record.antall_aksjer::integer, 0);
      
      IF v_shares_int <= 0 THEN
        v_error_count := v_error_count + 1;
        CONTINUE;
      END IF;

      -- Determine entity type and parse birth year/orgnr
      IF LENGTH(REGEXP_REPLACE(TRIM(v_staging_record.fodselsaar_orgnr), '[^0-9]', '', 'g')) = 9 THEN
        v_entity_type := 'company';
        v_birth_year_int := NULL;
      ELSE
        v_entity_type := 'person';
        v_birth_year_int := COALESCE(v_staging_record.fodselsaar_orgnr::integer, NULL);
        
        IF v_birth_year_int < 1900 OR v_birth_year_int > EXTRACT(YEAR FROM CURRENT_DATE) THEN
          v_birth_year_int := NULL;
        END IF;
      END IF;

      -- Clean country code
      v_country_code := UPPER(TRIM(COALESCE(v_staging_record.landkode, 'NOR')));

      -- Insert or update company
      INSERT INTO public.share_companies (orgnr, name, year, total_shares, calculated_total, user_id)
      VALUES (v_orgnr_clean, TRIM(v_staging_record.selskap), v_staging_record.year, 0, 0, p_user_id)
      ON CONFLICT (orgnr, year, COALESCE(user_id::text, 'global'))
      DO UPDATE SET 
        name = EXCLUDED.name
      RETURNING id INTO v_company_id;

      -- Insert or get entity
      INSERT INTO public.share_entities (
        entity_type, name, orgnr, birth_year, country_code, user_id
      )
      VALUES (
        v_entity_type, 
        TRIM(v_staging_record.navn_aksjonaer), 
        CASE WHEN v_entity_type = 'company' THEN REGEXP_REPLACE(TRIM(v_staging_record.fodselsaar_orgnr), '[^0-9]', '', 'g') ELSE NULL END,
        v_birth_year_int,
        v_country_code,
        p_user_id
      )
      ON CONFLICT (entity_type, name, COALESCE(orgnr, ''), COALESCE(birth_year::text, ''), country_code, COALESCE(user_id::text, 'global'))
      DO UPDATE SET 
        name = EXCLUDED.name
      RETURNING id INTO v_entity_id;

      -- Insert or update holding
      INSERT INTO public.share_holdings (
        company_orgnr, holder_id, share_class, shares, year, user_id
      )
      VALUES (v_orgnr_clean, v_entity_id, TRIM(v_staging_record.aksjeklasse), v_shares_int, v_staging_record.year, p_user_id)
      ON CONFLICT (company_orgnr, holder_id, share_class, year, COALESCE(user_id::text, 'global'))
      DO UPDATE SET 
        shares = EXCLUDED.shares
      RETURNING id INTO v_holding_id;

      v_processed_count := v_processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE 'Error processing staging record %: %', v_staging_record.id, SQLERRM;
    END;
  END LOOP;

  -- Delete the processed records from staging
  DELETE FROM public.shareholders_staging 
  WHERE job_id = p_job_id
  AND id IN (
    SELECT id FROM public.shareholders_staging 
    WHERE job_id = p_job_id
    ORDER BY id 
    LIMIT p_limit OFFSET p_offset
  );

  RAISE NOTICE 'Batch processing completed in % ms. Processed: %, Errors: %', 
    EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
    v_processed_count, 
    v_error_count;

  RETURN json_build_object(
    'processed_count', v_processed_count,
    'errors_count', v_error_count,
    'total_found', v_total_found,
    'duration_ms', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000
  );
END;
$$;