-- Create table for detailed payment information per submission
CREATE TABLE public.payroll_payment_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL,
  monthly_submission_id UUID NULL,
  calendar_month TEXT NOT NULL,
  account_number TEXT NULL,
  kid_arbeidsgiveravgift TEXT NULL,
  kid_forskuddstrekk TEXT NULL,
  kid_finansskatt TEXT NULL,
  due_date DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for detailed income analysis by type and month
CREATE TABLE public.payroll_income_by_type (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL,
  calendar_month TEXT NOT NULL,
  income_type TEXT NOT NULL,
  income_description TEXT NULL,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  benefit_type TEXT NULL, -- 'kontantytelse' or 'naturalytelse'
  triggers_aga BOOLEAN NOT NULL DEFAULT false,
  subject_to_tax_withholding BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for detailed submission information
CREATE TABLE public.payroll_submission_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_import_id UUID NOT NULL,
  monthly_submission_id UUID NULL,
  calendar_month TEXT NOT NULL,
  altinn_reference TEXT NULL,
  submission_id TEXT NULL,
  message_id TEXT NULL,
  status TEXT NULL,
  delivery_time TIMESTAMP WITH TIME ZONE NULL,
  altinn_timestamp TIMESTAMP WITH TIME ZONE NULL,
  source_system TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.payroll_payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_income_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_submission_details ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_payment_info
CREATE POLICY "Users can view payment info for their imports" 
ON public.payroll_payment_info 
FOR SELECT 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage payment info for their imports" 
ON public.payroll_payment_info 
FOR ALL 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

-- RLS policies for payroll_income_by_type
CREATE POLICY "Users can view income by type for their imports" 
ON public.payroll_income_by_type 
FOR SELECT 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage income by type for their imports" 
ON public.payroll_income_by_type 
FOR ALL 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

-- RLS policies for payroll_submission_details
CREATE POLICY "Users can view submission details for their imports" 
ON public.payroll_submission_details 
FOR SELECT 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage submission details for their imports" 
ON public.payroll_submission_details 
FOR ALL 
USING (payroll_import_id IN (
  SELECT id FROM public.payroll_imports 
  WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

-- Add indexes for better performance
CREATE INDEX idx_payroll_payment_info_import_id ON public.payroll_payment_info(payroll_import_id);
CREATE INDEX idx_payroll_income_by_type_import_id ON public.payroll_income_by_type(payroll_import_id);
CREATE INDEX idx_payroll_submission_details_import_id ON public.payroll_submission_details(payroll_import_id);