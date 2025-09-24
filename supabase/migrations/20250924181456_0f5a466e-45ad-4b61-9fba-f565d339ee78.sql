-- Fix the old process_shareholders_batch function to use correct ON CONFLICT clauses
-- This fixes the entity_key vs holder_id issue and person entity constraints

-- Drop the old problematic function first 
DROP FUNCTION IF EXISTS process_shareholders_batch(uuid, uuid, integer, integer);

-- Create the corrected function that matches our current constraints
CREATE OR REPLACE FUNCTION process_shareholders_batch(
  p_job_id uuid,
  p_user_id uuid, 
  p_offset integer,
  p_limit integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_next_offset INTEGER;
  v_is_done BOOLEAN := FALSE;
  v_total_staging_rows INTEGER;
  v_remaining_rows INTEGER;
  v_batch_size INTEGER;
BEGIN
  -- Log function start
  RAISE NOTICE 'Processing shareholders batch (FIXED): job_id=%, user_id=%, offset=%, limit=%', 
    p_job_id, p_user_id, p_offset, p_limit;

  -- Reduce batch size for better memory management
  v_batch_size := LEAST(p_limit, 500);
  
  -- Check total rows in staging for this user
  SELECT COUNT(*) INTO v_total_staging_rows 
  FROM shareholders_staging 
  WHERE user_id = p_user_id;
  
  RAISE NOTICE 'Total staging rows for user %: %', p_user_id, v_total_staging_rows;
  
  -- Calculate remaining rows after this offset
  v_remaining_rows := GREATEST(0, v_total_staging_rows - p_offset);
  v_processed_count := LEAST(v_batch_size, v_remaining_rows);
  v_next_offset := p_offset + v_processed_count;
  v_is_done := (v_next_offset >= v_total_staging_rows);

  -- Only process if there are rows to process
  IF v_processed_count > 0 THEN
    -- Start transaction for batch processing
    BEGIN
      RAISE NOTICE 'Processing batch: offset=%, limit=%, actual_count=%', p_offset, v_batch_size, v_processed_count;
      
      -- 1) COMPANIES: Insert/update companies from staging data
      WITH staged_companies AS (
        SELECT DISTINCT ON (orgnr, year, user_id)
          NULLIF(TRIM(orgnr), '') AS orgnr,
          NULLIF(TRIM(selskap), '') AS name,
          COALESCE(year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year,
          user_id,
          id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(orgnr), '') IS NOT NULL
          AND s.id > p_offset 
          AND s.id <= (p_offset + v_batch_size)
        ORDER BY orgnr, year, user_id, id
      )
      INSERT INTO share_companies (orgnr, name, year, user_id)
      SELECT orgnr, name, year, user_id FROM staged_companies
      ON CONFLICT (orgnr, year, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        user_id = COALESCE(share_companies.user_id, EXCLUDED.user_id);

      GET DIAGNOSTICS v_processed_count = ROW_COUNT;
      RAISE NOTICE 'Inserted/updated % companies', v_processed_count;

      -- 2) ENTITIES: Handle companies (9-digit orgnr)
      WITH staged_company_entities AS (
        SELECT DISTINCT ON (name, orgnr, user_id)
          NULLIF(TRIM(navn_aksjonaer), '') AS name,
          NULLIF(TRIM(fodselsaar_orgnr), '') AS orgnr,
          NULL::INTEGER AS birth_year,
          COALESCE(NULLIF(TRIM(landkode), ''), 'NO') AS country_code,
          'company' AS entity_type,
          user_id,
          id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
          AND LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9
          AND s.id > p_offset 
          AND s.id <= (p_offset + v_batch_size)
        ORDER BY name, orgnr, user_id, id
      )
      INSERT INTO share_entities (name, orgnr, birth_year, country_code, entity_type, user_id)
      SELECT name, orgnr, birth_year, country_code, entity_type, user_id FROM staged_company_entities
      ON CONFLICT (orgnr, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        country_code = EXCLUDED.country_code;

      GET DIAGNOSTICS v_processed_count = ROW_COUNT;
      RAISE NOTICE 'Inserted/updated % company entities', v_processed_count;

      -- 3) ENTITIES: Handle persons with SAFE birth_year conversion
      -- FIXED: Use correct ON CONFLICT clause for person entities
      WITH staged_person_entities AS (
        SELECT DISTINCT ON (name, birth_year, country_code, user_id, entity_type)
          NULLIF(TRIM(navn_aksjonaer), '') AS name,
          NULL AS orgnr,
          -- SAFE birth_year conversion - only convert valid 4-digit years
          CASE 
            WHEN NULLIF(TRIM(fodselsaar_orgnr), '') IS NULL THEN NULL
            WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 4 
              AND NULLIF(TRIM(fodselsaar_orgnr), '') ~ '^\d+$'
              AND NULLIF(TRIM(fodselsaar_orgnr), '')::NUMERIC BETWEEN 1900 AND 2100
            THEN NULLIF(TRIM(fodselsaar_orgnr), '')::INTEGER
            ELSE NULL
          END AS birth_year,
          COALESCE(NULLIF(TRIM(landkode), ''), 'NO') AS country_code,
          'person' AS entity_type,
          user_id,
          id
        FROM shareholders_staging s
        WHERE user_id = p_user_id
          AND NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
          AND LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) != 9 -- Not a company orgnr
          AND s.id > p_offset 
          AND s.id <= (p_offset + v_batch_size)
        ORDER BY name, birth_year, country_code, user_id, entity_type, id
      )
      INSERT INTO share_entities (name, orgnr, birth_year, country_code, entity_type, user_id)
      SELECT name, orgnr, birth_year, country_code, entity_type, user_id FROM staged_person_entities
      -- FIXED: Use the correct constraint that matches our unique index
      ON CONFLICT (name, birth_year, country_code, user_id, entity_type) DO UPDATE SET
        name = EXCLUDED.name;

      GET DIAGNOSTICS v_processed_count = ROW_COUNT;
      RAISE NOTICE 'Inserted/updated % person entities', v_processed_count;

      -- 4) HOLDINGS: Insert share holdings with proper entity joins using UUID id
      -- FIXED: Use entity id instead of entity_key for holder_id
      WITH holdings_to_insert AS (
        SELECT DISTINCT ON (s.orgnr, e.id, s.aksjeklasse, s.year, s.user_id)
          NULLIF(TRIM(s.orgnr), '') AS company_orgnr,
          e.id AS holder_id, -- Use UUID id, not entity_key
          NULLIF(TRIM(s.aksjeklasse), '') AS share_class,
          COALESCE(s.antall_aksjer, 0) AS shares,
          COALESCE(s.year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year,
          s.user_id
        FROM shareholders_staging s
        JOIN share_entities e ON (
          e.name = NULLIF(TRIM(s.navn_aksjonaer), '')
          AND e.user_id = s.user_id
          AND (
            -- For persons: match by name, birth_year, country_code
            (e.entity_type = 'person' 
             AND e.birth_year = CASE 
                 WHEN NULLIF(TRIM(s.fodselsaar_orgnr), '') IS NULL THEN NULL
                 WHEN LENGTH(NULLIF(TRIM(s.fodselsaar_orgnr), '')) = 4 
                   AND NULLIF(TRIM(s.fodselsaar_orgnr), '') ~ '^\d+$'
                   AND NULLIF(TRIM(s.fodselsaar_orgnr), '')::NUMERIC BETWEEN 1900 AND 2100
                 THEN NULLIF(TRIM(s.fodselsaar_orgnr), '')::INTEGER
                 ELSE NULL
               END
             AND e.country_code = COALESCE(NULLIF(TRIM(s.landkode), ''), 'NO'))
            OR
            -- For companies: match by name and orgnr
            (e.entity_type = 'company' 
             AND e.orgnr = NULLIF(TRIM(s.fodselsaar_orgnr), ''))
          )
        )
        WHERE s.user_id = p_user_id
          AND NULLIF(TRIM(s.orgnr), '') IS NOT NULL
          AND NULLIF(TRIM(s.navn_aksjonaer), '') IS NOT NULL
          AND s.id > p_offset 
          AND s.id <= (p_offset + v_batch_size)
        ORDER BY s.orgnr, e.id, s.aksjeklasse, s.year, s.user_id, s.id
      )
      INSERT INTO share_holdings (company_orgnr, holder_id, share_class, shares, year, user_id)
      SELECT company_orgnr, holder_id, share_class, shares, year, user_id FROM holdings_to_insert
      -- This ON CONFLICT is already correct - using holder_id (UUID) not entity_key
      ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) DO UPDATE SET
        shares = EXCLUDED.shares,
        user_id = COALESCE(share_holdings.user_id, EXCLUDED.user_id);

      GET DIAGNOSTICS v_processed_count = ROW_COUNT;
      RAISE NOTICE 'Inserted/updated % holdings', v_processed_count;

      -- 5) Update job progress
      UPDATE import_jobs 
      SET 
        rows_loaded = v_next_offset,
        status = CASE WHEN v_is_done THEN 'completed' ELSE status END,
        total_rows = CASE WHEN v_is_done THEN v_total_staging_rows ELSE total_rows END
      WHERE id = p_job_id;

      -- Calculate actual processed count from staging table range
      SELECT COUNT(*) INTO v_processed_count
      FROM shareholders_staging
      WHERE user_id = p_user_id
        AND id > p_offset 
        AND id <= (p_offset + v_batch_size);

      RAISE NOTICE 'Successfully processed batch: % rows, next_offset=%, done=%', 
        v_processed_count, v_next_offset, v_is_done;

    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error processing batch at offset %: % (SQLSTATE: %)', p_offset, SQLERRM, SQLSTATE;
        
        UPDATE import_jobs 
        SET 
          status = 'error',
          error = 'Batch processing error at offset ' || p_offset || ': ' || SQLERRM
        WHERE id = p_job_id;
        
        RAISE;
    END;
  ELSE
    -- No rows to process, mark as done
    v_is_done := TRUE;
    
    UPDATE import_jobs 
    SET 
      status = 'completed',
      total_rows = v_total_staging_rows,
      rows_loaded = v_total_staging_rows
    WHERE id = p_job_id;
    
    RAISE NOTICE 'No rows to process, marking job as completed';
  END IF;

  -- Return result as JSON
  RETURN json_build_object(
    'next_offset', v_next_offset,
    'done', v_is_done,
    'processed_count', v_processed_count,
    'total_staging_rows', v_total_staging_rows,
    'job_id', p_job_id,
    'user_id', p_user_id
  );
END;
$$;