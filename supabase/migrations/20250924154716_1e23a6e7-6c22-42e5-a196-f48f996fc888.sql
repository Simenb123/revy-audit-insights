-- Fix ON CONFLICT constraints in process_shareholders_batch to match actual database unique constraints
CREATE OR REPLACE FUNCTION process_shareholders_batch(
    p_user_id uuid,
    p_year integer,
    p_batch_size integer DEFAULT 100
)
RETURNS TABLE(
    companies_processed integer,
    entities_processed integer,
    holdings_processed integer,
    companies_created integer,
    entities_created integer,
    holdings_created integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_companies_processed integer := 0;
    v_entities_processed integer := 0;
    v_holdings_processed integer := 0;
    v_companies_created integer := 0;
    v_entities_created integer := 0;
    v_holdings_created integer := 0;
    v_batch_processed integer := 0;
BEGIN
    -- Process companies from staging
    WITH company_inserts AS (
        INSERT INTO share_companies (
            orgnr, selskap, year, user_id, created_at, updated_at
        )
        SELECT DISTINCT 
            s.orgnr,
            s.selskap,
            p_year,
            p_user_id,
            now(),
            now()
        FROM shareholders_staging s
        WHERE s.user_id = p_user_id
          AND s.orgnr IS NOT NULL 
          AND s.selskap IS NOT NULL
        LIMIT p_batch_size
        ON CONFLICT (orgnr, year, user_id) DO UPDATE SET
            selskap = EXCLUDED.selskap,
            updated_at = now()
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_companies_processed FROM company_inserts;
    
    v_companies_created := v_companies_processed;

    -- Process individual entities from staging  
    WITH individual_entity_inserts AS (
        INSERT INTO share_entities (
            name, birth_year, country_code, entity_type, user_id, created_at, updated_at
        )
        SELECT DISTINCT
            s.navn_aksjonaer as name,
            CASE 
                WHEN s.fodselsaar_orgnr ~ '^\d{4}$' AND s.fodselsaar_orgnr::integer BETWEEN 1900 AND 2010
                THEN s.fodselsaar_orgnr::integer
                ELSE NULL
            END as birth_year,
            COALESCE(s.landkode, 'NOR') as country_code,
            'individual' as entity_type,
            p_user_id,
            now(),
            now()
        FROM shareholders_staging s
        WHERE s.user_id = p_user_id
          AND s.navn_aksjonaer IS NOT NULL
          AND s.fodselsaar_orgnr IS NOT NULL
          AND s.fodselsaar_orgnr ~ '^\d{4}$'
          AND s.fodselsaar_orgnr::integer BETWEEN 1900 AND 2010
        LIMIT p_batch_size
        ON CONFLICT (name, birth_year, country_code, user_id, entity_type) DO UPDATE SET
            updated_at = now()
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_entities_processed FROM individual_entity_inserts;

    -- Process company entities from staging
    WITH company_entity_inserts AS (
        INSERT INTO share_entities (
            orgnr, name, entity_type, user_id, created_at, updated_at
        )
        SELECT DISTINCT
            s.fodselsaar_orgnr as orgnr,
            s.navn_aksjonaer as name,
            'company' as entity_type,
            p_user_id,
            now(),
            now()
        FROM shareholders_staging s
        WHERE s.user_id = p_user_id
          AND s.navn_aksjonaer IS NOT NULL
          AND s.fodselsaar_orgnr IS NOT NULL
          AND s.fodselsaar_orgnr ~ '^\d{9}$'
        LIMIT p_batch_size
        ON CONFLICT (orgnr, user_id) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = now()
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_batch_processed FROM company_entity_inserts;
    
    v_entities_processed := v_entities_processed + v_batch_processed;
    v_entities_created := v_entities_processed;

    -- Process holdings from staging
    WITH holdings_inserts AS (
        INSERT INTO share_holdings (
            company_orgnr, shares, share_class, year, user_id, created_at, updated_at
        )
        SELECT 
            s.orgnr as company_orgnr,
            s.antall_aksjer as shares,
            s.aksjeklasse as share_class,
            p_year,
            p_user_id,
            now(),
            now()
        FROM shareholders_staging s
        JOIN share_companies sc ON sc.orgnr = s.orgnr AND sc.year = p_year AND sc.user_id = p_user_id
        JOIN share_entities se ON (
            (se.entity_type = 'individual' AND se.name = s.navn_aksjonaer AND se.user_id = p_user_id AND 
             se.birth_year = CASE 
                WHEN s.fodselsaar_orgnr ~ '^\d{4}$' AND s.fodselsaar_orgnr::integer BETWEEN 1900 AND 2010
                THEN s.fodselsaar_orgnr::integer
                ELSE NULL
             END) OR
            (se.entity_type = 'company' AND se.orgnr = s.fodselsaar_orgnr AND se.user_id = p_user_id)
        )
        WHERE s.user_id = p_user_id
          AND s.antall_aksjer IS NOT NULL
          AND s.antall_aksjer > 0
        LIMIT p_batch_size
        ON CONFLICT (company_orgnr, entity_key, share_class, year, user_id) DO UPDATE SET
            shares = EXCLUDED.shares,
            updated_at = now()
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_holdings_processed FROM holdings_inserts;
    
    v_holdings_created := v_holdings_processed;

    RETURN QUERY SELECT 
        v_companies_processed,
        v_entities_processed, 
        v_holdings_processed,
        v_companies_created,
        v_entities_created,
        v_holdings_created;
END;
$$;