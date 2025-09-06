-- Create SAF-T Customers table for master files persistence
CREATE TABLE IF NOT EXISTS public.saft_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  import_session_id uuid REFERENCES public.saft_import_sessions(id) ON DELETE CASCADE,
  upload_batch_id uuid REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  
  -- Customer identifiers
  customer_id text NOT NULL,
  customer_name text,
  vat_number text,
  
  -- Address information
  country text,
  city text,
  postal_code text,
  street_address text,
  
  -- Customer metadata
  customer_type text,
  customer_status text,
  
  -- BalanceAccountStructure information
  balance_account text,
  balance_account_id text,
  opening_debit_balance numeric DEFAULT 0,
  opening_credit_balance numeric DEFAULT 0,
  closing_debit_balance numeric DEFAULT 0,
  closing_credit_balance numeric DEFAULT 0,
  opening_balance_netto numeric DEFAULT 0,
  closing_balance_netto numeric DEFAULT 0,
  
  -- Payment terms for due date calculations
  payment_terms_days integer,
  payment_terms_months integer,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(client_id, import_session_id, customer_id)
);

-- Create SAF-T Suppliers table for master files persistence  
CREATE TABLE IF NOT EXISTS public.saft_suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  import_session_id uuid REFERENCES public.saft_import_sessions(id) ON DELETE CASCADE,
  upload_batch_id uuid REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  
  -- Supplier identifiers
  supplier_id text NOT NULL,
  supplier_name text,
  vat_number text,
  
  -- Address information
  country text,
  city text,
  postal_code text,
  street_address text,
  
  -- Supplier metadata
  supplier_type text,
  supplier_status text,
  
  -- BalanceAccountStructure information
  balance_account text,
  balance_account_id text,
  opening_debit_balance numeric DEFAULT 0,
  opening_credit_balance numeric DEFAULT 0,
  closing_debit_balance numeric DEFAULT 0,
  closing_credit_balance numeric DEFAULT 0,
  opening_balance_netto numeric DEFAULT 0,
  closing_balance_netto numeric DEFAULT 0,
  
  -- Payment terms for due date calculations
  payment_terms_days integer,
  payment_terms_months integer,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(client_id, import_session_id, supplier_id)
);

-- Create SAF-T Tax Table for tax codes persistence
CREATE TABLE IF NOT EXISTS public.saft_tax_table (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  import_session_id uuid REFERENCES public.saft_import_sessions(id) ON DELETE CASCADE,
  upload_batch_id uuid REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  
  -- Tax code information
  tax_code text NOT NULL,
  description text,
  tax_percentage numeric,
  standard_tax_code text,
  
  -- SAF-T 1.3 extended tax information
  exemption_reason text,
  declaration_period text,
  valid_from date,
  valid_to date,
  base_rate numeric,
  country text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(client_id, import_session_id, tax_code)
);

-- Enable RLS on all tables
ALTER TABLE public.saft_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saft_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saft_tax_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saft_customers
CREATE POLICY "Users can manage SAF-T customers for their clients" ON public.saft_customers
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for saft_suppliers  
CREATE POLICY "Users can manage SAF-T suppliers for their clients" ON public.saft_suppliers
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for saft_tax_table
CREATE POLICY "Users can manage SAF-T tax table for their clients" ON public.saft_tax_table
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saft_customers_client_session ON public.saft_customers(client_id, import_session_id);
CREATE INDEX IF NOT EXISTS idx_saft_customers_customer_id ON public.saft_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_saft_customers_balance_account ON public.saft_customers(balance_account);

CREATE INDEX IF NOT EXISTS idx_saft_suppliers_client_session ON public.saft_suppliers(client_id, import_session_id);
CREATE INDEX IF NOT EXISTS idx_saft_suppliers_supplier_id ON public.saft_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_saft_suppliers_balance_account ON public.saft_suppliers(balance_account);

CREATE INDEX IF NOT EXISTS idx_saft_tax_table_client_session ON public.saft_tax_table(client_id, import_session_id);
CREATE INDEX IF NOT EXISTS idx_saft_tax_table_tax_code ON public.saft_tax_table(tax_code);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saft_customers_updated_at 
  BEFORE UPDATE ON public.saft_customers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saft_suppliers_updated_at 
  BEFORE UPDATE ON public.saft_suppliers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saft_tax_table_updated_at 
  BEFORE UPDATE ON public.saft_tax_table 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();