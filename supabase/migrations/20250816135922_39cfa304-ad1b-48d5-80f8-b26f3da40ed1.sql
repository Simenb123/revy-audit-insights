-- Update existing records with account data from client_chart_of_accounts (if not already populated)
UPDATE public.general_ledger_transactions glt
SET 
  account_number = coa.account_number,
  account_name = coa.account_name
FROM public.client_chart_of_accounts coa
WHERE glt.client_account_id = coa.id 
  AND (glt.account_number IS NULL OR glt.account_name IS NULL);

-- Create indexes for fast sorting (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_account_number 
ON public.general_ledger_transactions(account_number);

CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_account_name 
ON public.general_ledger_transactions(account_name);

-- Create composite index for better performance when sorting by both client_id and account fields
CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_client_account_sort 
ON public.general_ledger_transactions(client_id, account_number, account_name);

-- Create or replace trigger function to automatically populate account fields on insert/update
CREATE OR REPLACE FUNCTION populate_account_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Get account details from client_chart_of_accounts if not already set
  IF NEW.account_number IS NULL OR NEW.account_name IS NULL THEN
    SELECT account_number, account_name 
    INTO NEW.account_number, NEW.account_name
    FROM public.client_chart_of_accounts 
    WHERE id = NEW.client_account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_populate_account_fields ON public.general_ledger_transactions;
CREATE TRIGGER trigger_populate_account_fields
  BEFORE INSERT OR UPDATE ON public.general_ledger_transactions
  FOR EACH ROW
  EXECUTE FUNCTION populate_account_fields();