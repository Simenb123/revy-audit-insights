-- Add account_number and account_name columns to general_ledger_transactions for denormalization
ALTER TABLE public.general_ledger_transactions 
ADD COLUMN account_number text,
ADD COLUMN account_name text;

-- Create indexes for fast sorting
CREATE INDEX idx_general_ledger_transactions_account_number ON public.general_ledger_transactions(account_number);
CREATE INDEX idx_general_ledger_transactions_account_name ON public.general_ledger_transactions(account_name);

-- Update existing records with account data from client_chart_of_accounts
UPDATE public.general_ledger_transactions 
SET 
  account_number = coa.account_number,
  account_name = coa.account_name
FROM public.client_chart_of_accounts coa
WHERE public.general_ledger_transactions.client_account_id = coa.id;

-- Create trigger function to automatically populate account fields on insert/update
CREATE OR REPLACE FUNCTION populate_account_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Get account details from client_chart_of_accounts
  SELECT account_number, account_name 
  INTO NEW.account_number, NEW.account_name
  FROM public.client_chart_of_accounts 
  WHERE id = NEW.client_account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate account fields
CREATE TRIGGER trigger_populate_account_fields
  BEFORE INSERT OR UPDATE ON public.general_ledger_transactions
  FOR EACH ROW
  EXECUTE FUNCTION populate_account_fields();