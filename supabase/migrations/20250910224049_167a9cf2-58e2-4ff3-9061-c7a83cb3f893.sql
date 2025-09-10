-- Endre antall_aksjer fra INTEGER til BIGINT i shareholders_staging for å støtte store tall
DO $$
BEGIN
    -- Sjekk om tabellen eksisterer og antall_aksjer er INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shareholders_staging' 
        AND column_name = 'antall_aksjer' 
        AND data_type = 'integer'
    ) THEN
        -- Endre kolonne til BIGINT
        ALTER TABLE shareholders_staging 
        ALTER COLUMN antall_aksjer TYPE BIGINT;
        
        RAISE NOTICE 'Endret antall_aksjer fra INTEGER til BIGINT i shareholders_staging';
    ELSE
        RAISE NOTICE 'shareholders_staging.antall_aksjer er allerede BIGINT eller tabellen eksisterer ikke';
    END IF;
END
$$;