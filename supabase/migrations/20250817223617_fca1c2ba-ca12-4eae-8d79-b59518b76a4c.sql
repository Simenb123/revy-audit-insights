-- Create table for monthly payroll submissions
CREATE TABLE public.payroll_monthly_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  submission_data JSONB NOT NULL DEFAULT '{}',
  summary_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for employee details per import
CREATE TABLE public.payroll_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payroll_import_id, employee_id)
);

-- Create table for income details per employee
CREATE TABLE public.payroll_income_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for raw A07 data backup
CREATE TABLE public.payroll_raw_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  raw_json JSONB NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_payroll_monthly_submissions_import_id ON public.payroll_monthly_submissions(payroll_import_id);
CREATE INDEX idx_payroll_monthly_submissions_period ON public.payroll_monthly_submissions(period_year, period_month);
CREATE INDEX idx_payroll_employees_import_id ON public.payroll_employees(payroll_import_id);
CREATE INDEX idx_payroll_income_details_employee_id ON public.payroll_income_details(payroll_employee_id);
CREATE INDEX idx_payroll_income_details_period ON public.payroll_income_details(period_year, period_month);
CREATE INDEX idx_payroll_raw_data_import_id ON public.payroll_raw_data(payroll_import_id);

-- Enable RLS on new tables
ALTER TABLE public.payroll_monthly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_income_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_raw_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payroll_monthly_submissions
CREATE POLICY "Users can view monthly submissions for their clients"
ON public.payroll_monthly_submissions
FOR SELECT
USING (
  payroll_import_id IN (
    SELECT pi.id FROM public.payroll_imports pi
    JOIN public.clients c ON pi.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create RLS policies for payroll_employees
CREATE POLICY "Users can view employees for their clients"
ON public.payroll_employees
FOR SELECT
USING (
  payroll_import_id IN (
    SELECT pi.id FROM public.payroll_imports pi
    JOIN public.clients c ON pi.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create RLS policies for payroll_income_details
CREATE POLICY "Users can view income details for their clients"
ON public.payroll_income_details
FOR SELECT
USING (
  payroll_employee_id IN (
    SELECT pe.id FROM public.payroll_employees pe
    JOIN public.payroll_imports pi ON pe.payroll_import_id = pi.id
    JOIN public.clients c ON pi.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create RLS policies for payroll_raw_data
CREATE POLICY "Users can view raw data for their clients"
ON public.payroll_raw_data
FOR SELECT
USING (
  payroll_import_id IN (
    SELECT pi.id FROM public.payroll_imports pi
    JOIN public.clients c ON pi.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- System can insert data into all tables
CREATE POLICY "System can insert monthly submissions"
ON public.payroll_monthly_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert employees"
ON public.payroll_employees
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert income details"
ON public.payroll_income_details
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert raw data"
ON public.payroll_raw_data
FOR INSERT
WITH CHECK (true);