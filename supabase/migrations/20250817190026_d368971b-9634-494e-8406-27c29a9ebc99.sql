-- Create accounting periods table for proper period management
CREATE TABLE public.accounting_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voucher sequences table for voucher numbering
CREATE TABLE public.voucher_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  last_voucher_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, year, month)
);

-- Create journal entries table for manual bookkeeping
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  voucher_number TEXT NOT NULL,
  voucher_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_document_id UUID,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by UUID,
  posted_by UUID,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal entry lines table for debit/credit entries
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL,
  line_number INTEGER NOT NULL,
  account_id UUID NOT NULL,
  description TEXT,
  debit_amount NUMERIC(15,2) DEFAULT 0,
  credit_amount NUMERIC(15,2) DEFAULT 0,
  vat_code TEXT,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_journal_entry_lines_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_journal_entry_lines_account 
    FOREIGN KEY (account_id) REFERENCES public.client_chart_of_accounts(id),
  CONSTRAINT check_debit_credit_exclusive 
    CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0) OR (debit_amount = 0 AND credit_amount = 0))
);

-- Create AI suggested postings table for storing AI recommendations
CREATE TABLE public.ai_suggested_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  client_id UUID NOT NULL,
  suggested_entries JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.8,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
  applied_to_journal_entry_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_ai_suggested_postings_document 
    FOREIGN KEY (document_id) REFERENCES public.client_documents_files(id),
  CONSTRAINT fk_ai_suggested_postings_journal_entry 
    FOREIGN KEY (applied_to_journal_entry_id) REFERENCES public.journal_entries(id)
);

-- Enable RLS on all tables
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggested_postings ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounting_periods
CREATE POLICY "Users can manage accounting periods for their clients" 
ON public.accounting_periods 
FOR ALL 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for voucher_sequences
CREATE POLICY "Users can manage voucher sequences for their clients" 
ON public.voucher_sequences 
FOR ALL 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for journal_entries
CREATE POLICY "Users can manage journal entries for their clients" 
ON public.journal_entries 
FOR ALL 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for journal_entry_lines
CREATE POLICY "Users can manage journal entry lines for their clients" 
ON public.journal_entry_lines 
FOR ALL 
USING (journal_entry_id IN (
  SELECT id FROM journal_entries 
  WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
));

-- RLS policies for ai_suggested_postings
CREATE POLICY "Users can manage AI suggested postings for their clients" 
ON public.ai_suggested_postings 
FOR ALL 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Create function to get next voucher number
CREATE OR REPLACE FUNCTION public.get_next_voucher_number(p_client_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  next_number INTEGER;
  voucher_text TEXT;
BEGIN
  -- Get and increment the voucher number
  INSERT INTO public.voucher_sequences (client_id, year, month, last_voucher_number)
  VALUES (p_client_id, p_year, p_month, 1)
  ON CONFLICT (client_id, year, month)
  DO UPDATE SET 
    last_voucher_number = voucher_sequences.last_voucher_number + 1,
    updated_at = now()
  RETURNING last_voucher_number INTO next_number;
  
  -- Format as YYYY-MM-NNNN
  voucher_text := p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN voucher_text;
END;
$$;

-- Create function to validate journal entry balance
CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_debit NUMERIC(15,2);
  total_credit NUMERIC(15,2);
  entry_total NUMERIC(15,2);
BEGIN
  -- Calculate totals for the journal entry
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  -- Check if debit equals credit
  IF total_debit != total_credit THEN
    RAISE EXCEPTION 'Journal entry is not balanced: Debit = %, Credit = %', total_debit, total_credit;
  END IF;
  
  -- Update the total amount on journal entry
  UPDATE public.journal_entries
  SET total_amount = total_debit,
      updated_at = now()
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for journal entry balance validation
CREATE TRIGGER validate_journal_entry_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_journal_entry_balance();

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_client_id ON public.journal_entries(client_id);
CREATE INDEX idx_journal_entries_voucher_date ON public.journal_entries(voucher_date);
CREATE INDEX idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX idx_journal_entry_lines_journal_entry_id ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_id);
CREATE INDEX idx_ai_suggested_postings_document_id ON public.ai_suggested_postings(document_id);
CREATE INDEX idx_ai_suggested_postings_status ON public.ai_suggested_postings(status);
CREATE INDEX idx_voucher_sequences_client_year_month ON public.voucher_sequences(client_id, year, month);