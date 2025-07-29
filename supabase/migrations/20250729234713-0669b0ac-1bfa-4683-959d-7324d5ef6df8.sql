-- Drop existing RLS policies that are causing access issues
DROP POLICY IF EXISTS "Users can view their clients' general ledger transactions" ON public.general_ledger_transactions;
DROP POLICY IF EXISTS "Users can view their clients' chart of accounts" ON public.client_chart_of_accounts;

-- Create new RLS policies using the correct pattern
CREATE POLICY "Users can view their clients' general ledger transactions"
ON public.general_ledger_transactions
FOR SELECT
USING (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can view their clients' chart of accounts"
ON public.client_chart_of_accounts
FOR SELECT
USING (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
));

-- Also ensure users can manage (insert/update/delete) their clients' data
CREATE POLICY "Users can manage their clients' general ledger transactions"
ON public.general_ledger_transactions
FOR ALL
USING (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
))
WITH CHECK (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can manage their clients' chart of accounts"
ON public.client_chart_of_accounts
FOR ALL
USING (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
))
WITH CHECK (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
));