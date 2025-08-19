-- Create a safer function that only fixes data where Norwegian characters are definitely corrupted
CREATE OR REPLACE FUNCTION fix_norwegian_encoding_safe()
RETURNS jsonb AS $$
DECLARE
  result JSONB := '{}';
  clients_updated INTEGER := 0;
  transactions_updated INTEGER := 0;
  accounts_updated INTEGER := 0;
BEGIN
  -- Fix clients table - only where we have clear encoding corruption patterns
  UPDATE public.clients
  SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    ceo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    ceo, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    chair = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    chair, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    current_auditor_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    current_auditor_name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE name ~ 'Ã[¦¸¥†˜…]' OR ceo ~ 'Ã[¦¸¥†˜…]' OR chair ~ 'Ã[¦¸¥†˜…]' OR current_auditor_name ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS clients_updated = ROW_COUNT;
  
  -- Fix general ledger transactions
  UPDATE public.general_ledger_transactions
  SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE description ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS transactions_updated = ROW_COUNT;
  
  -- Fix chart of accounts
  UPDATE public.client_chart_of_accounts
  SET account_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    account_name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE account_name ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS accounts_updated = ROW_COUNT;
  
  -- Return results
  result := jsonb_build_object(
    'clients_updated', clients_updated,
    'transactions_updated', transactions_updated,
    'accounts_updated', accounts_updated,
    'total_updated', clients_updated + transactions_updated + accounts_updated,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;