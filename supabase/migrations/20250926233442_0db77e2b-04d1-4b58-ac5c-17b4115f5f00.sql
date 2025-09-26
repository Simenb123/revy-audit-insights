-- Fixed process_shareholders_batch function with proper error handling
CREATE OR REPLACE FUNCTION process_shareholders_batch(
  p_job_id bigint,
  p_user_id uuid,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 1000
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_processed_count integer := 0;
  v_companies_count integer := 0;
  v_entities_count integer := 0;
  v_holdings_count integer := 0;
  staging_record RECORD;
  v_entity_id uuid;
  v_start_time timestamp := clock_timestamp();
BEGIN
  RAISE NOTICE 'Processing batch for job_id: %, user_id: %, offset: %, limit: %', p_job_id, p_user_id, p_offset, p_limit;

  -- Process all staging records for this job_id
  FOR staging_record IN 
    SELECT 
      orgnr, selskap as company_name, year,
      navn_aksjonaer as holder_name, 
      CASE 
        WHEN fodselsaar_orgnr ~ '^[0-9]{4}$' THEN 'person'
        WHEN length(fodselsaar_orgnr) = 9 THEN 'company'
        ELSE 'person'
      END as entity_type,
      CASE 
        WHEN fodselsaar_orgnr ~ '^[0-9]{4}$' THEN fodselsaar_orgnr::integer
        ELSE NULL
      END as birth_year,
      CASE 
        WHEN length(fodselsaar_orgnr) = 9 THEN fodselsaar_orgnr
        ELSE NULL
      END as holder_orgnr,
      landkode as country_code,
      aksjeklasse as share_class,
      antall_aksjer as shares
    FROM shareholders_staging 
    WHERE job_id = p_job_id AND user_id = p_user_id
    ORDER BY id
    LIMIT p_limit OFFSET p_offset
  LOOP
    v_processed_count := v_processed_count + 1;

    -- Insert/update company data
    IF staging_record.orgnr IS NOT NULL AND staging_record.company_name IS NOT NULL THEN
      INSERT INTO share_companies (orgnr, name, year, user_id, total_shares)
      VALUES (
        staging_record.orgnr,
        staging_record.company_name,
        staging_record.year,
        p_user_id,
        0
      )
      ON CONFLICT DO NOTHING;
      v_companies_count := v_companies_count + 1;
    END IF;

    -- Insert/update entity data and get ID
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
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_entity_id;
      
      -- If no ID returned (conflict), get the existing entity ID
      IF v_entity_id IS NULL THEN
        SELECT id INTO v_entity_id FROM share_entities 
        WHERE name = staging_record.holder_name 
          AND COALESCE(birth_year, 0) = COALESCE(staging_record.birth_year, 0)
          AND COALESCE(country_code, 'NO') = COALESCE(staging_record.country_code, 'NO')
          AND user_id = p_user_id
          AND entity_type = staging_record.entity_type
        LIMIT 1;
      END IF;
      
      v_entities_count := v_entities_count + 1;
    END IF;

    -- Insert/update holding data
    IF staging_record.orgnr IS NOT NULL AND v_entity_id IS NOT NULL AND staging_record.shares > 0 THEN
      INSERT INTO share_holdings (
        company_orgnr, holder_id, share_class, shares, year, user_id
      )
      VALUES (
        staging_record.orgnr,
        v_entity_id,
        COALESCE(staging_record.share_class, 'A'),
        staging_record.shares,
        staging_record.year,
        p_user_id
      )
      ON CONFLICT DO NOTHING;
      
      v_holdings_count := v_holdings_count + 1;
    END IF;

    -- Reset entity_id for next record
    v_entity_id := NULL;
  END LOOP;

  -- Clean up processed staging records for this job
  DELETE FROM shareholders_staging 
  WHERE job_id = p_job_id AND user_id = p_user_id;

  RAISE NOTICE 'Batch complete: processed %, companies %, entities %, holdings %', 
    v_processed_count, v_companies_count, v_entities_count, v_holdings_count;

  RETURN jsonb_build_object(
    'processed_count', v_processed_count,
    'companies_inserted', v_companies_count,
    'entities_inserted', v_entities_count,
    'holdings_inserted', v_holdings_count,
    'execution_time_ms', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000
  );
END;
$$;