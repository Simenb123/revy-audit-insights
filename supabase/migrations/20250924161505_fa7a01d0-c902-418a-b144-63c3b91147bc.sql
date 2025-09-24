-- Drop and recreate process_shareholders_batch function with correct ON CONFLICT constraints
DROP FUNCTION IF EXISTS process_shareholders_batch(uuid, integer, integer);

CREATE OR REPLACE FUNCTION process_shareholders_batch(
  p_user_id UUID,
  p_year INTEGER,
  p_batch_size INTEGER DEFAULT 100
) RETURNS TABLE (
  processed_count INTEGER,
  has_more BOOLEAN,
  error_message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_has_more BOOLEAN := FALSE;
  v_error TEXT := NULL;
BEGIN
  -- Process companies first
  WITH batch_companies AS (
    SELECT DISTINCT
      company_orgnr,
      company_name,
      year
    FROM shareholders_staging 
    WHERE user_id = p_user_id 
      AND year = p_year 
      AND processed = FALSE
    LIMIT p_batch_size
  )
  INSERT INTO share_companies (orgnr, name, year, user_id, total_shares)
  SELECT 
    bc.company_orgnr,
    bc.company_name,
    bc.year,
    p_user_id,
    0 -- Will be calculated later
  FROM batch_companies bc
  ON CONFLICT (orgnr, year, user_id) 
  DO UPDATE SET 
    name = EXCLUDED.name;

  GET DIAGNOSTICS v_processed_count = ROW_COUNT;

  -- Process entities (persons)
  WITH batch_person_entities AS (
    SELECT DISTINCT
      holder_name,
      birth_year,
      country_code
    FROM shareholders_staging 
    WHERE user_id = p_user_id 
      AND year = p_year 
      AND processed = FALSE
      AND (holder_orgnr IS NULL OR holder_orgnr = '')
    LIMIT p_batch_size
  )
  INSERT INTO share_entities (name, birth_year, country_code, user_id, entity_type)
  SELECT 
    bpe.holder_name,
    bpe.birth_year,
    bpe.country_code,
    p_user_id,
    'person'::entity_type
  FROM batch_person_entities bpe
  ON CONFLICT (name, birth_year, country_code, user_id, entity_type) 
  DO UPDATE SET 
    name = EXCLUDED.name;

  -- Process entities (companies)
  WITH batch_company_entities AS (
    SELECT DISTINCT
      holder_name,
      holder_orgnr
    FROM shareholders_staging 
    WHERE user_id = p_user_id 
      AND year = p_year 
      AND processed = FALSE
      AND holder_orgnr IS NOT NULL 
      AND holder_orgnr != ''
    LIMIT p_batch_size
  )
  INSERT INTO share_entities (name, orgnr, user_id, entity_type)
  SELECT 
    bce.holder_name,
    bce.holder_orgnr,
    p_user_id,
    'company'::entity_type
  FROM batch_company_entities bce
  ON CONFLICT (orgnr, user_id) 
  DO UPDATE SET 
    name = EXCLUDED.name;

  -- Process holdings with correct holder_id mapping
  WITH batch_holdings AS (
    SELECT 
      ss.company_orgnr,
      ss.holder_name,
      ss.birth_year,
      ss.country_code,
      ss.holder_orgnr,
      ss.share_class,
      ss.shares,
      ss.year,
      CASE 
        WHEN ss.holder_orgnr IS NOT NULL AND ss.holder_orgnr != '' THEN 'company'
        ELSE 'person'
      END as entity_type
    FROM shareholders_staging ss
    WHERE ss.user_id = p_user_id 
      AND ss.year = p_year 
      AND ss.processed = FALSE
    LIMIT p_batch_size
  )
  INSERT INTO share_holdings (company_orgnr, holder_id, share_class, shares, year, user_id)
  SELECT 
    bh.company_orgnr,
    se.entity_key, -- Use entity_key as holder_id
    bh.share_class,
    bh.shares,
    bh.year,
    p_user_id
  FROM batch_holdings bh
  JOIN share_entities se ON (
    se.name = bh.holder_name 
    AND se.user_id = p_user_id
    AND se.entity_type = bh.entity_type::entity_type
    AND (
      (bh.entity_type = 'person' AND se.birth_year = bh.birth_year AND se.country_code = bh.country_code)
      OR 
      (bh.entity_type = 'company' AND se.orgnr = bh.holder_orgnr)
    )
  )
  ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) 
  DO UPDATE SET 
    shares = EXCLUDED.shares;

  -- Mark processed records
  UPDATE shareholders_staging 
  SET processed = TRUE 
  WHERE user_id = p_user_id 
    AND year = p_year 
    AND processed = FALSE
    AND ctid IN (
      SELECT ctid FROM shareholders_staging 
      WHERE user_id = p_user_id 
        AND year = p_year 
        AND processed = FALSE
      LIMIT p_batch_size
    );

  -- Check if more records exist
  SELECT EXISTS(
    SELECT 1 FROM shareholders_staging 
    WHERE user_id = p_user_id 
      AND year = p_year 
      AND processed = FALSE
  ) INTO v_has_more;

  RETURN QUERY SELECT v_processed_count, v_has_more, v_error;

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN QUERY SELECT 0, FALSE, v_error;
END;
$$;