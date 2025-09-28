-- Complete rewrite of process_shareholders_batch to fix error reporting
-- This version is explicit about when to count errors vs successful processing

DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
    p_job_id bigint, 
    p_user_id uuid, 
    p_offset integer DEFAULT 0, 
    p_limit integer DEFAULT 50000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_processed_count integer := 0;
    v_errors_count integer := 0;
    v_staging_row RECORD;
    v_entity_id uuid;
    v_error_msg text;
    v_success boolean;
BEGIN
    RAISE NOTICE 'Processing batch for job_id % with limit %', p_job_id, p_limit;
    
    -- Process staging rows in batches using FOR UPDATE SKIP LOCKED
    FOR v_staging_row IN 
        SELECT * FROM shareholders_staging 
        WHERE job_id = p_job_id 
          AND processed_at IS NULL
        ORDER BY id 
        LIMIT p_limit 
        FOR UPDATE SKIP LOCKED
    LOOP
        v_success := false;
        v_error_msg := NULL;
        
        BEGIN
            -- Insert or update share_companies
            INSERT INTO share_companies (
                orgnr, name, year, user_id, total_shares
            ) VALUES (
                v_staging_row.orgnr,
                v_staging_row.selskap,
                v_staging_row.year,
                v_staging_row.user_id,
                0 -- Will be updated by aggregation
            )
            ON CONFLICT (orgnr, year, user_id) 
            DO UPDATE SET 
                name = EXCLUDED.name;

            -- Insert or update share_entities (shareholders)
            INSERT INTO share_entities (
                entity_type,
                name,
                orgnr,
                birth_year,
                user_id,
                country_code
            ) VALUES (
                CASE 
                    WHEN length(v_staging_row.fodselsaar_orgnr) = 9 THEN 'company'::entity_type
                    WHEN length(v_staging_row.fodselsaar_orgnr) = 4 THEN 'person'::entity_type
                    ELSE 'person'::entity_type
                END,
                v_staging_row.navn_aksjonaer,
                CASE WHEN length(v_staging_row.fodselsaar_orgnr) = 9 THEN v_staging_row.fodselsaar_orgnr ELSE NULL END,
                CASE WHEN length(v_staging_row.fodselsaar_orgnr) = 4 THEN v_staging_row.fodselsaar_orgnr::integer ELSE NULL END,
                v_staging_row.user_id,
                v_staging_row.landkode
            )
            ON CONFLICT (entity_type, name, COALESCE(orgnr, ''), COALESCE(birth_year, 0), user_id) 
            DO UPDATE SET 
                country_code = EXCLUDED.country_code
            RETURNING id INTO v_entity_id;

            -- If no entity was returned (conflict case), get the existing one
            IF v_entity_id IS NULL THEN
                SELECT id INTO v_entity_id 
                FROM share_entities 
                WHERE entity_type = CASE 
                        WHEN length(v_staging_row.fodselsaar_orgnr) = 9 THEN 'company'::entity_type
                        WHEN length(v_staging_row.fodselsaar_orgnr) = 4 THEN 'person'::entity_type
                        ELSE 'person'::entity_type
                    END
                  AND name = v_staging_row.navn_aksjonaer
                  AND COALESCE(orgnr, '') = COALESCE(CASE WHEN length(v_staging_row.fodselsaar_orgnr) = 9 THEN v_staging_row.fodselsaar_orgnr ELSE NULL END, '')
                  AND COALESCE(birth_year, 0) = COALESCE(CASE WHEN length(v_staging_row.fodselsaar_orgnr) = 4 THEN v_staging_row.fodselsaar_orgnr::integer ELSE NULL END, 0)
                  AND user_id = v_staging_row.user_id;
            END IF;

            -- Insert or update share_holdings
            INSERT INTO share_holdings (
                company_orgnr,
                holder_id,
                shares,
                share_class,
                year,
                user_id
            ) VALUES (
                v_staging_row.orgnr,
                v_entity_id,
                COALESCE(v_staging_row.antall_aksjer, 0),
                COALESCE(v_staging_row.aksjeklasse, 'Ordinære aksjer'),
                v_staging_row.year,
                v_staging_row.user_id
            )
            ON CONFLICT (company_orgnr, holder_id, share_class, year, user_id) 
            DO UPDATE SET 
                shares = EXCLUDED.shares;

            -- Mark staging row as processed successfully
            UPDATE shareholders_staging 
            SET processed_at = now() 
            WHERE id = v_staging_row.id;

            -- Only increment success counter if we reach this point without exception
            v_processed_count := v_processed_count + 1;
            v_success := true;
            
            RAISE NOTICE 'Successfully processed staging row %', v_staging_row.id;

        EXCEPTION WHEN OTHERS THEN
            -- This is a REAL error - increment error counter
            v_errors_count := v_errors_count + 1;
            v_error_msg := SQLERRM;
            v_success := false;
            
            -- Mark staging row as processed even if it failed to avoid infinite retries
            UPDATE shareholders_staging 
            SET processed_at = now() 
            WHERE id = v_staging_row.id;
            
            -- Log the actual error
            RAISE WARNING 'REAL ERROR processing staging row %: %', v_staging_row.id, v_error_msg;
        END;
    END LOOP;

    -- Update import_jobs.rows_loaded with successful rows only
    IF v_processed_count > 0 THEN
        UPDATE import_jobs 
        SET rows_loaded = rows_loaded + v_processed_count
        WHERE id = p_job_id;
        
        RAISE NOTICE 'Updated import_jobs.rows_loaded with % successful rows', v_processed_count;
    END IF;

    -- Return explicit counts
    RAISE NOTICE 'Batch complete: % successful, % errors', v_processed_count, v_errors_count;
    
    RETURN jsonb_build_object(
        'processed_count', v_processed_count,
        'errors_count', v_errors_count,
        'total_batch_size', v_processed_count + v_errors_count
    );
END;
$$;