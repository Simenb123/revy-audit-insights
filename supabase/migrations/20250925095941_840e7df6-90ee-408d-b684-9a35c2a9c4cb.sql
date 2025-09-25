-- Create new process_shareholders_batch function that takes bigint job_id
-- but contains all the updated logic with correct ON CONFLICT clauses

CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
  p_job_id bigint,
  p_user_id uuid,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_processed_count integer := 0;
  v_entities_created integer := 0;
  v_holdings_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_batch_records jsonb;
  v_record jsonb;
  v_entity_id uuid;
  v_company_orgnr text;
  v_holder_id uuid;
  v_share_class text;
  v_shares integer;
  v_year integer;
BEGIN
  -- Get batch of records from shareholders_staging
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'company_orgnr', company_orgnr,
      'holder_name', holder_name,
      'holder_birth_year', holder_birth_year,
      'holder_country_code', holder_country_code,
      'share_class', share_class,
      'shares', shares,
      'year', year,
      'entity_type', entity_type
    )
  ) INTO v_batch_records
  FROM shareholders_staging 
  WHERE job_id = p_job_id 
    AND user_id = p_user_id
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;

  -- Process each record in the batch
  FOR v_record IN SELECT jsonb_array_elements(COALESCE(v_batch_records, '[]'::jsonb))
  LOOP
    BEGIN
      v_processed_count := v_processed_count + 1;
      
      -- Extract values from record
      v_company_orgnr := v_record->>'company_orgnr';
      v_share_class := v_record->>'share_class';
      v_shares := (v_record->>'shares')::integer;
      v_year := (v_record->>'year')::integer;

      -- Create or get entity (person/company)
      INSERT INTO share_entities (
        name,
        birth_year,
        country_code,
        user_id,
        entity_type
      ) VALUES (
        v_record->>'holder_name',
        CASE WHEN v_record->>'holder_birth_year' != '' 
             THEN (v_record->>'holder_birth_year')::integer 
             ELSE NULL END,
        NULLIF(v_record->>'holder_country_code', ''),
        p_user_id,
        COALESCE(v_record->>'entity_type', 'person')
      )
      ON CONFLICT (name, birth_year, country_code, user_id, entity_type) 
      DO UPDATE SET updated_at = now()
      RETURNING id INTO v_entity_id;

      -- Use the entity_id as holder_id for holdings
      v_holder_id := v_entity_id;

      -- Create share holding
      INSERT INTO share_holdings (
        company_orgnr,
        holder_id,
        share_class,
        shares,
        year,
        user_id
      ) VALUES (
        v_company_orgnr,
        v_holder_id,
        v_share_class,
        v_shares,
        v_year,
        p_user_id
      )
      ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) 
      DO UPDATE SET 
        shares = EXCLUDED.shares,
        updated_at = now();

      v_holdings_created := v_holdings_created + 1;

    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_object(
          'record_id', v_record->>'id',
          'error', SQLERRM,
          'company_orgnr', v_company_orgnr
        );
    END;
  END LOOP;

  -- Return processing summary
  RETURN jsonb_build_object(
    'processed_count', v_processed_count,
    'entities_created', v_entities_created,
    'holdings_created', v_holdings_created,
    'errors', v_errors,
    'has_more', (SELECT COUNT(*) > p_offset + p_limit 
                 FROM shareholders_staging 
                 WHERE job_id = p_job_id AND user_id = p_user_id)
  );
END;
$$;