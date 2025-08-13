-- Create RLS policies for general_ledger_transactions table
-- This allows the transactions edge function to filter by date and account range

-- Policy to allow users to read transactions for clients in their firm
CREATE POLICY "Users can read transactions for clients in their firm" 
ON public.general_ledger_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = general_ledger_transactions.client_id
    AND c.audit_firm_id = public.get_user_firm(auth.uid())
  )
);

-- Policy for service role (used by edge functions)
CREATE POLICY "Service role can read all transactions" 
ON public.general_ledger_transactions 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Ensure RLS is enabled on the table
ALTER TABLE public.general_ledger_transactions ENABLE ROW LEVEL SECURITY;

-- Also create policies for client_chart_of_accounts table if they don't exist
CREATE POLICY "Users can read chart of accounts for clients in their firm" 
ON public.client_chart_of_accounts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_chart_of_accounts.client_id
    AND c.audit_firm_id = public.get_user_firm(auth.uid())
  )
);

CREATE POLICY "Service role can read all chart of accounts" 
ON public.client_chart_of_accounts 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Ensure RLS is enabled on chart of accounts table
ALTER TABLE public.client_chart_of_accounts ENABLE ROW LEVEL SECURITY;