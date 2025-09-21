-- Fix SQL syntax error in process_shareholders_batch function
-- The issue is SELECT DISTINCT with ORDER BY on columns not in SELECT list

CREATE OR REPLACE FUNCTION public.process_shareholders_batch(p_job_id bigint, p_user_id uuid, p_offset integer DEFAULT 0, p_limit integer DEFAULT 50000)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_processed_count INTEGER := 0;
  v_next_offset INTEGER;
  v_is_done BOOLEAN := FALSE;
  v_total_staging_rows INTEGER;
  v_remaining_rows INTEGER;
BEGIN
  -- Log function start
  RAISE NOTICE 'Processing shareholders batch: job_id=%, user_id=%, offset=%, limit=%', 
    p_job_id, p_user_id, p_offset, p_limit;

  -- Check total rows in staging for this user
  SELECT COUNT(*) INTO v_total_staging_rows 
  FROM shareholders_staging 
  WHERE user_id = p_user_id;
  
  -- Calculate remaining rows after this offset
  v_remaining_rows := GREATEST(0, v_total_staging_rows - p_offset);
  v_processed_count := LEAST(p_limit, v_remaining_rows);
  v_next_offset := p_offset + v_processed_count;
  v_is_done := (v_next_offset >= v_total_staging_rows);

  -- Only process if there are rows to process
  IF v_processed_count > 0 THEN
    -- Start transaction for batch processing
    BEGIN
      -- 1) COMPANIES: Insert/update companies from staging data (fixed DISTINCT + ORDER BY issue)
      WITH staged_companies AS (
        SELECT DISTINCT
          NULLIF(TRIM(orgnr), '') AS orgnr,
          NULLIF(TRIM(selskap), '') AS name,
          COALESCE(year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year,
          user_id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(orgnr), '') IS NOT NULL
          AND s.id > p_offset 
          AND s.id <= (p_offset + p_limit)
      )
      INSERT INTO share_companies (orgnr, name, year, user_id)
      SELECT orgnr, name, year, user_id FROM staged_companies
      ON CONFLICT (orgnr, year, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        user_id = COALESCE(share_companies.user_id, EXCLUDED.user_id);

      -- 2) ENTITIES: Handle companies (9-digit orgnr) - fixed DISTINCT + ORDER BY issue
      WITH staged_company_entities AS (
        SELECT DISTINCT
          LOWER(TRIM(navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(fodselsaar_orgnr), ''), '?') AS entity_key,
          NULLIF(TRIM(navn_aksjonaer), '') AS name,
          NULLIF(TRIM(fodselsaar_orgnr), '') AS orgnr,
          NULL AS birth_year,
          COALESCE(NULLIF(TRIM(landkode), ''), 'NO') AS country_code,
          'company' AS entity_type,
          user_id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
          AND LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9
          AND s.id > p_offset 
          AND s.id <= (p_offset + p_limit)
      )
      INSERT INTO share_entities (entity_key, name, orgnr, birth_year, country_code, entity_type, user_id)
      SELECT entity_key, name, orgnr, birth_year, country_code, entity_type, user_id FROM staged_company_entities
      ON CONFLICT (entity_key, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        orgnr = EXCLUDED.orgnr,
        country_code = EXCLUDED.country_code;

      -- 3) ENTITIES: Handle persons (4-digit birth year) - fixed DISTINCT + ORDER BY issue
      WITH staged_person_entities AS (
        SELECT DISTINCT
          LOWER(TRIM(navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(fodselsaar_orgnr), ''), '?') AS entity_key,
          NULLIF(TRIM(navn_aksjonaer), '') AS name,
          NULL AS orgnr,
          CASE 
            WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 4 
              AND NULLIF(TRIM(fodselsaar_orgnr), '') ~ '^\d{4}$' 
            THEN NULLIF(TRIM(fodselsaar_orgnr), '')::INTEGER
            ELSE NULL
          END AS birth_year,
          COALESCE(NULLIF(TRIM(landkode), ''), 'NO') AS country_code,
          'person' AS entity_type,
          user_id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
          AND LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) != 9
          AND s.id > p_offset 
          AND s.id <= (p_offset + p_limit)
      )
      INSERT INTO share_entities (entity_key, name, orgnr, birth_year, country_code, entity_type, user_id)
      SELECT entity_key, name, orgnr, birth_year, country_code, entity_type, user_id FROM staged_person_entities
      ON CONFLICT (entity_key, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        birth_year = EXCLUDED.birth_year,
        country_code = EXCLUDED.country_code;

      -- 4) HOLDINGS: Insert share holdings with proper entity joins (no ORDER BY issue here)
      INSERT INTO share_holdings (company_orgnr, holder_id, share_class, shares, year, user_id)
      SELECT
        NULLIF(TRIM(s.orgnr), '') AS company_orgnr,
        e.id AS holder_id,
        NULLIF(TRIM(s.aksjeklasse), '') AS share_class,
        COALESCE(s.antall_aksjer, 0) AS shares,
        COALESCE(s.year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year,
        s.user_id
      FROM shareholders_staging s
      JOIN share_entities e
        ON e.entity_key = LOWER(TRIM(s.navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(s.fodselsaar_orgnr), ''), '?')
        AND e.user_id = s.user_id
      WHERE s.user_id = p_user_id
        AND NULLIF(TRIM(s.orgnr), '') IS NOT NULL
        AND NULLIF(TRIM(s.navn_aksjonaer), '') IS NOT NULL
        AND s.id > p_offset 
        AND s.id <= (p_offset + p_limit)
      ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) DO UPDATE SET
        shares = EXCLUDED.shares,
        user_id = COALESCE(share_holdings.user_id, EXCLUDED.user_id);

      -- 5) Update job progress
      UPDATE import_jobs 
      SET 
        rows_loaded = v_next_offset,
        status = CASE WHEN v_is_done THEN 'completed' ELSE status END,
        total_rows = CASE WHEN v_is_done THEN v_total_staging_rows ELSE total_rows END
      WHERE id = p_job_id;

      RAISE NOTICE 'Successfully processed batch: % rows, next_offset=%, done=%', 
        v_processed_count, v_next_offset, v_is_done;

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error and update job status
        RAISE NOTICE 'Error processing batch: %', SQLERRM;
        
        UPDATE import_jobs 
        SET 
          status = 'error',
          error = SQLERRM
        WHERE id = p_job_id;
        
        RAISE; -- Re-raise the error
    END;
  ELSE
    -- No rows to process, mark as done if we're at or beyond the end
    v_is_done := TRUE;
    
    UPDATE import_jobs 
    SET 
      status = 'completed',
      total_rows = v_total_staging_rows,
      rows_loaded = v_total_staging_rows
    WHERE id = p_job_id;
  END IF;

  -- Return result as JSON
  RETURN json_build_object(
    'next_offset', v_next_offset,
    'done', v_is_done,
    'processed_count', v_processed_count,
    'total_staging_rows', v_total_staging_rows,
    'job_id', p_job_id
  );

END;
$function$;