-- Fix column name from navn_foretak to selskap in process_shareholders_batch function
CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
  p_job_id bigint,
  p_user_id uuid,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_processed integer := 0;
  v_errors integer := 0;
  v_batch_record record;
  v_company_id uuid;
  v_entity_id uuid;
  v_error_msg text;
BEGIN
  -- Process batch of staging records
  FOR v_batch_record IN
    SELECT 
      orgnr,
      selskap,
      navn_aksjonaer,
      fodselsaar_orgnr,
      landkode,
      aksjeklasse,
      antall_aksjer,
      year
    FROM public.shareholders_staging 
    WHERE user_id = p_user_id
    ORDER BY id
    OFFSET p_offset 
    LIMIT p_limit
  LOOP
    BEGIN
      -- Insert or update company
      INSERT INTO public.share_companies (
        orgnr, name, year, user_id, total_shares, calculated_total
      ) VALUES (
        v_batch_record.orgnr,
        COALESCE(v_batch_record.selskap, 'Ukjent selskap'),
        v_batch_record.year,
        p_user_id,
        0,
        0
      )
      ON CONFLICT (orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET
        name = COALESCE(EXCLUDED.name, share_companies.name),
        updated_at = now()
      RETURNING id INTO v_company_id;

      -- Insert or update entity (shareholder)
      INSERT INTO public.share_entities (
        entity_type,
        name,
        orgnr,
        birth_year,
        country_code,
        user_id
      ) VALUES (
        CASE 
          WHEN v_batch_record.fodselsaar_orgnr ~ '^[0-9]{4}$' THEN 'person'
          ELSE 'company'
        END,
        COALESCE(v_batch_record.navn_aksjonaer, 'Ukjent aksjonær'),
        CASE 
          WHEN v_batch_record.fodselsaar_orgnr !~ '^[0-9]{4}$' THEN v_batch_record.fodselsaar_orgnr
          ELSE NULL
        END,
        CASE 
          WHEN v_batch_record.fodselsaar_orgnr ~ '^[0-9]{4}$' THEN v_batch_record.fodselsaar_orgnr::integer
          ELSE NULL
        END,
        COALESCE(v_batch_record.landkode, 'NO'),
        p_user_id
      )
      ON CONFLICT (
        entity_type,
        name,
        COALESCE(orgnr, ''),
        COALESCE(birth_year, 0),
        COALESCE(country_code, ''),
        COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
      )
      DO UPDATE SET
        name = COALESCE(EXCLUDED.name, share_entities.name),
        updated_at = now()
      RETURNING id INTO v_entity_id;

      -- Insert or update shareholding
      INSERT INTO public.share_holdings (
        company_orgnr,
        holder_id,
        share_class,
        shares,
        year,
        user_id
      ) VALUES (
        v_batch_record.orgnr,
        v_entity_id,
        COALESCE(v_batch_record.aksjeklasse, 'A'),
        COALESCE(v_batch_record.antall_aksjer, 0),
        v_batch_record.year,
        p_user_id
      )
      ON CONFLICT (company_orgnr, holder_id, share_class, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET
        shares = EXCLUDED.shares,
        updated_at = now();

      v_processed := v_processed + 1;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        RAISE WARNING 'Error processing record %: %', v_batch_record.orgnr, v_error_msg;
        v_errors := v_errors + 1;
        CONTINUE;
    END;
  END LOOP;

  -- Update job status
  UPDATE public.shareholder_import_queue
  SET 
    processed_rows = processed_rows + v_processed,
    error_rows = error_rows + v_errors,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'errors', v_errors,
    'job_id', p_job_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Batch processing failed: %', SQLERRM;
END;
$function$;