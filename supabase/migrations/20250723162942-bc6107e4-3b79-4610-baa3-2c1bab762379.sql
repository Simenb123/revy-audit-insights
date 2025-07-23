-- Create table for storing column mapping history and learning
CREATE TABLE public.column_mapping_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_type TEXT NOT NULL, -- 'trial_balance', 'general_ledger', 'chart_of_accounts'
  source_column TEXT NOT NULL,
  target_field TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0,
  is_manual_override BOOLEAN DEFAULT false,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin-configurable field definitions
CREATE TABLE public.field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date'
  is_required BOOLEAN NOT NULL DEFAULT false,
  file_type TEXT NOT NULL, -- 'trial_balance', 'general_ledger', 'chart_of_accounts'
  aliases TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_key, file_type)
);

-- Enable RLS
ALTER TABLE public.column_mapping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policies for column_mapping_history
CREATE POLICY "Users can view mapping history for their clients" 
ON public.column_mapping_history 
FOR SELECT 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can create mapping history for their clients" 
ON public.column_mapping_history 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  client_id IN (SELECT clients.id FROM clients WHERE clients.user_id = auth.uid())
);

-- RLS policies for field_definitions
CREATE POLICY "Everyone can view field definitions" 
ON public.field_definitions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage field definitions" 
ON public.field_definitions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default field definitions for trial balance
INSERT INTO public.field_definitions (field_key, field_label, data_type, is_required, file_type, aliases, sort_order) VALUES
('account_number', 'Kontonr', 'text', true, 'trial_balance', ARRAY['kontonummer', 'konto', 'kontonr', 'kontonr.', 'account', 'accountnumber', 'accountnr', 'accountnr.', 'acc', 'acc_no', 'konto_nr', 'account_no'], 1),
('account_name', 'Kontonavn', 'text', true, 'trial_balance', ARRAY['kontonavn', 'navn', 'beskrivelse', 'kontonavn', 'accountname', 'account_name', 'name', 'description', 'konto_navn', 'account_description'], 2),
('balance_last_year', 'Saldo i fjor', 'number', false, 'trial_balance', ARRAY['saldo_ifjor', 'saldo i fjor', 'forrige år', 'forrige_år', 'last_year', 'previous_year', 'balance_ly', 'ly_balance', 'fjor', 'i fjor'], 3),
('balance_current_year', 'Saldo i år', 'number', true, 'trial_balance', ARRAY['saldo_iår', 'saldo i år', 'dette år', 'dette_år', 'current_year', 'this_year', 'balance_cy', 'cy_balance', 'i år', 'iår', 'saldo'], 4);

-- Insert default field definitions for general ledger
INSERT INTO public.field_definitions (field_key, field_label, data_type, is_required, file_type, aliases, sort_order) VALUES
('account_number', 'Kontonr', 'text', true, 'general_ledger', ARRAY['kontonummer', 'konto', 'kontonr', 'kontonr.', 'account', 'accountnumber', 'accountnr', 'accountnr.', 'acc', 'acc_no', 'konto_nr', 'account_no'], 1),
('account_name', 'Kontonavn', 'text', true, 'general_ledger', ARRAY['kontonavn', 'navn', 'beskrivelse', 'kontonavn', 'accountname', 'account_name', 'name', 'description', 'konto_navn', 'account_description'], 2),
('date', 'Dato', 'date', true, 'general_ledger', ARRAY['dato', 'date', 'transaction_date', 'trans_date', 'posting_date', 'bilagsdato', 'regnskapsdato'], 3),
('voucher_number', 'Bilagsnr', 'text', false, 'general_ledger', ARRAY['bilagsnr', 'bilagsnummer', 'bilag', 'voucher', 'voucher_no', 'voucher_number', 'document_no', 'doc_no', 'ref'], 4),
('amount', 'Beløp', 'number', true, 'general_ledger', ARRAY['beløp', 'belop', 'amount', 'sum', 'value', 'total', 'kr', 'nok'], 5),
('text', 'Tekst', 'text', false, 'general_ledger', ARRAY['tekst', 'text', 'description', 'beskrivelse', 'memo', 'comment', 'note', 'details'], 6),
('description', 'Beskrivelse', 'text', false, 'general_ledger', ARRAY['beskrivelse', 'description', 'long_description', 'detail', 'explanation', 'kommentar'], 7),
('vat_code', 'Mvakode', 'text', false, 'general_ledger', ARRAY['mvakode', 'mva_kode', 'vat_code', 'vat', 'tax_code', 'moms', 'moms_kode'], 8),
('vat_amount', 'Mvabeløp', 'number', false, 'general_ledger', ARRAY['mvabeløp', 'mva_beløp', 'vat_amount', 'vat', 'tax_amount', 'moms_beløp', 'moms'], 9);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_column_mapping_history_updated_at
  BEFORE UPDATE ON public.column_mapping_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_definitions_updated_at
  BEFORE UPDATE ON public.field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();