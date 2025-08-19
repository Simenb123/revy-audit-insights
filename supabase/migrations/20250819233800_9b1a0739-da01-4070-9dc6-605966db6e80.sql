-- Create AR (Accounts Receivable) transactions table
CREATE TABLE public.ar_transactions (
  id bigserial PRIMARY KEY,
  upload_batch_id uuid NOT NULL REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  journal_id text,
  transaction_id text,
  record_id text,
  customer_id text,
  customer_name text,
  account_id text,
  account_number text,
  account_name text,
  document_no text,
  reference_no text,
  posting_date date,
  value_date date,
  due_date date,
  cid text,
  debit numeric(18,2),
  credit numeric(18,2),
  amount numeric(18,2),
  currency text,
  amount_currency numeric(18,2),
  exchange_rate numeric(18,6),
  vat_code text,
  vat_rate numeric(6,3),
  vat_base numeric(18,2),
  vat_debit numeric(18,2),
  vat_credit numeric(18,2),
  created_at timestamptz DEFAULT now()
);

-- Create AP (Accounts Payable) transactions table
CREATE TABLE public.ap_transactions (
  id bigserial PRIMARY KEY,
  upload_batch_id uuid NOT NULL REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  journal_id text,
  transaction_id text,
  record_id text,
  supplier_id text,
  supplier_name text,
  account_id text,
  account_number text,
  account_name text,
  document_no text,
  reference_no text,
  posting_date date,
  value_date date,
  due_date date,
  cid text,
  debit numeric(18,2),
  credit numeric(18,2),
  amount numeric(18,2),
  currency text,
  amount_currency numeric(18,2),
  exchange_rate numeric(18,6),
  vat_code text,
  vat_rate numeric(6,3),
  vat_base numeric(18,2),
  vat_debit numeric(18,2),
  vat_credit numeric(18,2),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_ar_upload_batch ON public.ar_transactions(upload_batch_id);
CREATE INDEX idx_ar_customer ON public.ar_transactions(customer_id);
CREATE INDEX idx_ar_due ON public.ar_transactions(due_date);
CREATE INDEX idx_ar_client ON public.ar_transactions(client_id);

CREATE INDEX idx_ap_upload_batch ON public.ap_transactions(upload_batch_id);
CREATE INDEX idx_ap_supplier ON public.ap_transactions(supplier_id);
CREATE INDEX idx_ap_due ON public.ap_transactions(due_date);
CREATE INDEX idx_ap_client ON public.ap_transactions(client_id);

-- Enable RLS
ALTER TABLE public.ar_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AR
CREATE POLICY "Users can view their own AR transactions" 
ON public.ar_transactions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AR transactions" 
ON public.ar_transactions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for AP
CREATE POLICY "Users can view their own AP transactions" 
ON public.ap_transactions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AP transactions" 
ON public.ap_transactions FOR INSERT 
WITH CHECK (user_id = auth.uid());