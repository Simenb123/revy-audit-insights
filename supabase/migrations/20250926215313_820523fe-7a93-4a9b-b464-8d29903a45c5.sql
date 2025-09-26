-- Drop all existing variants of process_shareholders_batch function
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, uuid, integer, integer);

-- Add job_id column to shareholders_staging
ALTER TABLE public.shareholders_staging 
ADD COLUMN IF NOT EXISTS job_id bigint;

-- Create the correct process_shareholders_batch function
CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
  p_job_id bigint,
  p_user_id uuid,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count integer := 0;
  v_companies_inserted integer := 0;
  v_entities_inserted integer := 0;
  v_holdings_inserted integer := 0;
  staging_record RECORD;
  v_entity_key text;
  v_start_time timestamp := clock_timestamp();
BEGIN
  -- Process all staging records for this job_id
  FOR staging_record IN 
    SELECT * FROM shareholders_staging 
    WHERE job_id = p_job_id AND user_id = p_user_id
    ORDER BY id
    LIMIT p_limit OFFSET p_offset
  LOOP
    v_processed_count := v_processed_count + 1;

    -- Insert/update company data
    IF staging_record.orgnr IS NOT NULL AND staging_record.company_name IS NOT NULL THEN
      INSERT INTO share_companies (orgnr, name, year, user_id, total_shares, calculated_total)
      VALUES (
        staging_record.orgnr,
        staging_record.company_name,
        staging_record.year,
        p_user_id,
        COALESCE(staging_record.total_shares, 0),
        COALESCE(staging_record.total_shares, 0)
      )
      ON CONFLICT (orgnr, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        year = EXCLUDED.year,
        total_shares = EXCLUDED.total_shares,
        calculated_total = EXCLUDED.calculated_total;
      
      v_companies_inserted := v_companies_inserted + 1;
    END IF;

    -- Generate entity key for shareholders
    v_entity_key := CASE 
      WHEN staging_record.entity_type = 'person' THEN
        staging_record.holder_name || '_' || 
        COALESCE(staging_record.birth_year::text, 'unknown') || '_' ||
        COALESCE(staging_record.country_code, 'NO')
      WHEN staging_record.entity_type = 'company' THEN
        COALESCE(staging_record.holder_orgnr, staging_record.holder_name || '_company')
      ELSE staging_record.holder_name
    END;

    -- Insert/update entity data
    IF staging_record.holder_name IS NOT NULL THEN
      INSERT INTO share_entities (
        entity_type, name, orgnr, birth_year, country_code, user_id
      )
      VALUES (
        staging_record.entity_type,
        staging_record.holder_name,
        staging_record.holder_orgnr,
        staging_record.birth_year,
        COALESCE(staging_record.country_code, 'NO'),
        p_user_id
      )
      ON CONFLICT (name, birth_year, country_code, user_id, entity_type) DO UPDATE SET
        orgnr = EXCLUDED.orgnr;
      
      v_entities_inserted := v_entities_inserted + 1;
    END IF;

    -- Insert/update holding data
    IF staging_record.orgnr IS NOT NULL AND staging_record.holder_name IS NOT NULL AND staging_record.shares > 0 THEN
      INSERT INTO share_holdings (
        company_orgnr, holder_id, share_class, shares, year, user_id
      )
      VALUES (
        staging_record.orgnr,
        v_entity_key,  -- Use entity_key as holder_id
        COALESCE(staging_record.share_class, 'A'),
        staging_record.shares,
        staging_record.year,
        p_user_id
      )
      ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) DO UPDATE SET
        shares = EXCLUDED.shares;
      
      v_holdings_inserted := v_holdings_inserted + 1;
    END IF;
  END LOOP;

  -- Clean up processed staging records for this job
  DELETE FROM shareholders_staging 
  WHERE job_id = p_job_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'processed_count', v_processed_count,
    'companies_inserted', v_companies_inserted,
    'entities_inserted', v_entities_inserted,
    'holdings_inserted', v_holdings_inserted,
    'execution_time_ms', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000
  );
END;
$$;