-- Create import sessions table to track detailed progress
CREATE TABLE IF NOT EXISTS public.import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    year INTEGER NOT NULL,
    total_file_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    current_batch INTEGER DEFAULT 0,
    total_batches INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    errors_count INTEGER DEFAULT 0,
    duplicates_count INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own import sessions" ON public.import_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own import sessions" ON public.import_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own import sessions" ON public.import_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own import sessions" ON public.import_sessions FOR DELETE USING (auth.uid() = user_id);

-- Function to get detailed import status including session progress
CREATE OR REPLACE FUNCTION get_detailed_import_status(
    p_session_id TEXT,
    p_year INTEGER,
    p_total_file_rows INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    session_data RECORD;
    db_counts RECORD;
BEGIN
    -- Get session information
    SELECT * INTO session_data
    FROM import_sessions
    WHERE session_id = p_session_id
    AND user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get database counts
    SELECT 
        COUNT(DISTINCT sc.orgnr) as companies_count,
        COUNT(sh.id) as holdings_count,
        COUNT(DISTINCT se.id) as entities_count,
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM share_holdings sh2 
            WHERE sh2.company_orgnr = sh.company_orgnr 
            AND sh2.holder_id = sh.holder_id 
            AND sh2.share_class = sh.share_class 
            AND sh2.year = sh.year 
            AND sh2.user_id = sh.user_id 
            AND sh2.id != sh.id
        ) THEN 1 END) as duplicates_count
    INTO db_counts
    FROM share_companies sc
    LEFT JOIN share_holdings sh ON sc.orgnr = sh.company_orgnr AND sc.year = sh.year AND sc.user_id = sh.user_id
    LEFT JOIN share_entities se ON sh.holder_id = se.id AND se.user_id = sh.user_id
    WHERE sc.year = p_year AND sc.user_id = auth.uid();
    
    -- Build result JSON
    SELECT json_build_object(
        'companies_count', COALESCE(db_counts.companies_count, 0),
        'holdings_count', COALESCE(db_counts.holdings_count, 0),
        'entities_count', COALESCE(db_counts.entities_count, 0),
        'needs_aggregation', false, -- For now, assume no aggregation needed
        'year', p_year,
        'processed_rows', COALESCE(session_data.processed_rows, 0),
        'total_file_rows', COALESCE(GREATEST(session_data.total_file_rows, p_total_file_rows), 0),
        'import_speed', CASE 
            WHEN session_data.start_time IS NOT NULL 
            THEN COALESCE(session_data.processed_rows / GREATEST(EXTRACT(EPOCH FROM (now() - session_data.start_time)) / 60, 1), 0)
            ELSE 0 
        END,
        'estimated_completion', CASE 
            WHEN session_data.status = 'active' AND session_data.processed_rows > 0 
            THEN (now() + ((GREATEST(session_data.total_file_rows, p_total_file_rows) - session_data.processed_rows) * EXTRACT(EPOCH FROM (now() - session_data.start_time)) / session_data.processed_rows) * interval '1 second')::text
            ELSE null 
        END,
        'session', CASE 
            WHEN session_data.session_id IS NOT NULL 
            THEN json_build_object(
                'session_id', session_data.session_id,
                'total_file_rows', COALESCE(session_data.total_file_rows, p_total_file_rows),
                'processed_rows', COALESCE(session_data.processed_rows, 0),
                'start_time', session_data.start_time,
                'status', session_data.status,
                'current_batch', COALESCE(session_data.current_batch, 0),
                'total_batches', COALESCE(session_data.total_batches, 0),
                'errors_count', COALESCE(session_data.errors_count, 0),
                'duplicates_count', COALESCE(session_data.duplicates_count, 0)
            )
            ELSE null 
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get import verification data
CREATE OR REPLACE FUNCTION get_import_verification(
    p_year INTEGER,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    file_stats RECORD;
    db_stats RECORD;
    integrity_stats RECORD;
    history_data JSON;
BEGIN
    -- Get file analysis (from import sessions)
    SELECT 
        COUNT(DISTINCT session_id) as total_files,
        SUM(total_file_rows) as total_file_rows,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as processed_files,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_files
    INTO file_stats
    FROM import_sessions
    WHERE user_id = auth.uid()
    AND (p_session_id IS NULL OR session_id = p_session_id)
    AND created_at >= now() - interval '30 days'; -- Last 30 days
    
    -- Get database counts
    SELECT 
        COUNT(DISTINCT sc.orgnr) as companies,
        COUNT(sh.id) as holdings,
        COUNT(DISTINCT se.id) as entities,
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM share_holdings sh2 
            WHERE sh2.company_orgnr = sh.company_orgnr 
            AND sh2.holder_id = sh.holder_id 
            AND sh2.share_class = sh.share_class 
            AND sh2.year = sh.year 
            AND sh2.user_id = sh.user_id 
            AND sh2.id != sh.id
        ) THEN 1 END) as duplicates
    INTO db_stats
    FROM share_companies sc
    LEFT JOIN share_holdings sh ON sc.orgnr = sh.company_orgnr AND sc.year = sh.year AND sc.user_id = sh.user_id
    LEFT JOIN share_entities se ON sh.holder_id = se.id AND se.user_id = sh.user_id
    WHERE sc.year = p_year AND sc.user_id = auth.uid();
    
    -- Get data integrity stats
    SELECT 
        COUNT(CASE WHEN sc.orgnr IS NULL THEN 1 END) as orphaned_holdings,
        COUNT(CASE WHEN sh.company_orgnr IS NOT NULL AND sc.orgnr IS NULL THEN 1 END) as missing_companies,
        COUNT(CASE WHEN LENGTH(sc.orgnr) NOT IN (8, 9) OR sc.orgnr !~ '^\d+$' THEN 1 END) as invalid_orgnr
    INTO integrity_stats
    FROM share_holdings sh
    LEFT JOIN share_companies sc ON sh.company_orgnr = sc.orgnr AND sh.year = sc.year AND sh.user_id = sc.user_id
    WHERE sh.year = p_year AND sh.user_id = auth.uid();
    
    -- Get import history
    SELECT COALESCE(json_agg(json_build_object(
        'session_id', session_id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status,
        'processed_rows', processed_rows,
        'error_count', errors_count
    ) ORDER BY start_time DESC), '[]'::json) INTO history_data
    FROM import_sessions
    WHERE user_id = auth.uid()
    AND created_at >= now() - interval '30 days'
    LIMIT 10;
    
    -- Calculate data quality score
    DECLARE
        quality_score INTEGER := 100;
        total_issues INTEGER := COALESCE(integrity_stats.orphaned_holdings, 0) + COALESCE(integrity_stats.missing_companies, 0) + COALESCE(integrity_stats.invalid_orgnr, 0);
        duplicate_rate NUMERIC := CASE WHEN COALESCE(db_stats.holdings, 0) > 0 THEN (COALESCE(db_stats.duplicates, 0)::NUMERIC / db_stats.holdings * 100) ELSE 0 END;
    BEGIN
        -- Deduct points for issues
        quality_score := quality_score - LEAST(total_issues * 5, 40); -- Max 40 points deduction for issues
        quality_score := quality_score - LEAST(duplicate_rate::INTEGER, 30); -- Max 30 points for duplicates
        quality_score := GREATEST(quality_score, 0); -- Don't go below 0
    END;
    
    -- Build final result
    SELECT json_build_object(
        'file_analysis', json_build_object(
            'total_files', COALESCE(file_stats.total_files, 0),
            'total_file_rows', COALESCE(file_stats.total_file_rows, 0),
            'processed_files', COALESCE(file_stats.processed_files, 0),
            'failed_files', COALESCE(file_stats.failed_files, 0)
        ),
        'database_counts', json_build_object(
            'companies', COALESCE(db_stats.companies, 0),
            'holdings', COALESCE(db_stats.holdings, 0),
            'entities', COALESCE(db_stats.entities, 0),
            'duplicates', COALESCE(db_stats.duplicates, 0)
        ),
        'data_integrity', json_build_object(
            'orphaned_holdings', COALESCE(integrity_stats.orphaned_holdings, 0),
            'missing_companies', COALESCE(integrity_stats.missing_companies, 0),
            'invalid_orgnr', COALESCE(integrity_stats.invalid_orgnr, 0),
            'data_quality_score', quality_score
        ),
        'import_history', history_data
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_sessions;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_sessions_updated_at
    BEFORE UPDATE ON public.import_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();