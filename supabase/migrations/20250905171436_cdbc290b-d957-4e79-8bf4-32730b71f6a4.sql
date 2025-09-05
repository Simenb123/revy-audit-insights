-- Step 1: Database extensions for complete SAF-T 1.3 storage

-- Create table for SAF-T Analysis Types
CREATE TABLE public.saft_analysis_types (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    upload_batch_id uuid,
    analysis_type text,
    analysis_type_description text,
    analysis_id text,
    analysis_id_description text,
    start_date date,
    end_date date,
    status text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for SAF-T Analysis Lines  
CREATE TABLE public.saft_analysis_lines (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    upload_batch_id uuid,
    journal_id text,
    record_id text,
    analysis_type text,
    analysis_id text,
    debit_amount numeric,
    credit_amount numeric,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for SAF-T Journal metadata
CREATE TABLE public.saft_journals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    upload_batch_id uuid,
    journal_id text,
    description text,
    posting_date date,
    journal_type text,
    batch_id text,
    system_id text,
    period_start date,
    period_end date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for SAF-T import sessions with validation results
CREATE TABLE public.saft_import_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    upload_batch_id uuid,
    file_name text NOT NULL,
    file_size bigint,
    import_status text NOT NULL DEFAULT 'pending',
    validation_results jsonb DEFAULT '{}',
    saft_version text,
    processing_started_at timestamp with time zone,
    processing_completed_at timestamp with time zone,
    error_details text,
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Extend client_chart_of_accounts with SAF-T 1.3 fields
ALTER TABLE public.client_chart_of_accounts 
ADD COLUMN IF NOT EXISTS grouping_category text,
ADD COLUMN IF NOT EXISTS grouping_code text,
ADD COLUMN IF NOT EXISTS standard_account_code text;

-- Extend general_ledger_transactions with SAF-T 1.3 fields
ALTER TABLE public.general_ledger_transactions 
ADD COLUMN IF NOT EXISTS modification_date date,
ADD COLUMN IF NOT EXISTS source_system text,
ADD COLUMN IF NOT EXISTS voucher_type text,
ADD COLUMN IF NOT EXISTS voucher_description text,
ADD COLUMN IF NOT EXISTS transaction_date date,
ADD COLUMN IF NOT EXISTS system_entry_date date,
ADD COLUMN IF NOT EXISTS system_entry_time time;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saft_analysis_types_client_batch ON public.saft_analysis_types(client_id, upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_saft_analysis_lines_client_batch ON public.saft_analysis_lines(client_id, upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_saft_journals_client_batch ON public.saft_journals(client_id, upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_saft_import_sessions_client ON public.saft_import_sessions(client_id);

-- Enable RLS on new tables
ALTER TABLE public.saft_analysis_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saft_analysis_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saft_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saft_import_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage SAF-T analysis types for their clients" ON public.saft_analysis_types
    FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage SAF-T analysis lines for their clients" ON public.saft_analysis_lines
    FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage SAF-T journals for their clients" ON public.saft_journals
    FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage SAF-T import sessions for their clients" ON public.saft_import_sessions
    FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saft_analysis_types_updated_at BEFORE UPDATE ON public.saft_analysis_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saft_analysis_lines_updated_at BEFORE UPDATE ON public.saft_analysis_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saft_journals_updated_at BEFORE UPDATE ON public.saft_journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saft_import_sessions_updated_at BEFORE UPDATE ON public.saft_import_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();