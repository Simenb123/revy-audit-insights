-- Add missing columns to shareholders_staging and import_jobs tables
ALTER TABLE public.shareholders_staging 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS needs_aggregation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Drop all existing versions of process_shareholders_batch function
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(uuid, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, integer, integer);
DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, uuid, integer);

-- Create new process_shareholders_batch function with correct signature
CREATE OR REPLACE FUNCTION public.process_shareholders_batch(
    p_job_id bigint,
    p_limit integer
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
BEGIN
    -- Process staging rows in batches using FOR UPDATE SKIP LOCKED
    FOR v_staging_row IN 
        SELECT * FROM shareholders_staging 
        WHERE job_id = p_job_id 
          AND processed_at IS NULL
        ORDER BY id 
        LIMIT p_limit 
        FOR UPDATE SKIP LOCKED
    LOOP
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

            -- If no entity was returned (no conflict), get the existing one
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

            -- Mark staging row as processed
            UPDATE shareholders_staging 
            SET processed_at = now() 
            WHERE id = v_staging_row.id;

            v_processed_count := v_processed_count + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue processing other rows
            v_errors_count := v_errors_count + 1;
            v_error_msg := SQLERRM;
            
            -- Mark staging row as processed even if it failed to avoid infinite retries
            UPDATE shareholders_staging 
            SET processed_at = now() 
            WHERE id = v_staging_row.id;
            
            -- Log the error
            RAISE WARNING 'Error processing staging row %: %', v_staging_row.id, v_error_msg;
        END;
    END LOOP;

    -- Update import_jobs.rows_loaded with the number of rows processed
    IF v_processed_count > 0 THEN
        UPDATE import_jobs 
        SET rows_loaded = rows_loaded + v_processed_count
        WHERE id = p_job_id;
    END IF;

    -- Return JSON with processed and error counts
    RETURN jsonb_build_object(
        'processed_count', v_processed_count,
        'errors_count', v_errors_count
    );
END;
$$;

-- Reset stuck jobs to queued status so they can be processed again
UPDATE import_jobs 
SET status = 'queued',
    rows_loaded = 0,
    error = NULL
WHERE id IN (74, 75, 76) 
  AND status = 'processing';

-- Add comment to document the function
COMMENT ON FUNCTION public.process_shareholders_batch(bigint, integer) IS 
'Processes shareholders staging data in batches for a specific job. Returns JSON with processed_count and errors_count.';

-- Refresh PostgREST schema cache
SELECT refresh_postgrest_schema();