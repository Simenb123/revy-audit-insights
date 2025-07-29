-- First, let's check what policies exist and drop them all to start fresh
DROP POLICY IF EXISTS "Users can view their clients' general ledger transactions" ON public.general_ledger_transactions;
DROP POLICY IF EXISTS "Users can manage their clients' general ledger transactions" ON public.general_ledger_transactions;
DROP POLICY IF EXISTS "Users can view their clients' chart of accounts" ON public.client_chart_of_accounts;
DROP POLICY IF EXISTS "Users can manage their clients' chart of accounts" ON public.client_chart_of_accounts;

-- Now create the correct policies for general_ledger_transactions
CREATE POLICY "Users can view their clients' general ledger transactions"
ON public.general_ledger_transactions
FOR SELECT
USING (client_id IN (
  SELECT clients.id 
  FROM clients 
  WHERE clients.user_id = auth.uid()
));

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

-- Now create the correct policies for client_chart_of_accounts
CREATE POLICY "Users can view their clients' chart of accounts"
ON public.client_chart_of_accounts
FOR SELECT
USING (client_id IN (
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