-- Set proper UTF8 collation for existing tables with Norwegian text
-- Only update tables that actually exist

-- Update clients table for Norwegian company names
ALTER TABLE public.clients 
ALTER COLUMN name TYPE text COLLATE "C",
ALTER COLUMN ceo TYPE text COLLATE "C", 
ALTER COLUMN chair TYPE text COLLATE "C",
ALTER COLUMN current_auditor_name TYPE text COLLATE "C";

-- Update audit action templates for Norwegian descriptions  
ALTER TABLE public.audit_action_templates 
ALTER COLUMN title TYPE text COLLATE "C",
ALTER COLUMN description TYPE text COLLATE "C",
ALTER COLUMN procedures TYPE text COLLATE "C";

-- Update client audit actions for Norwegian notes
ALTER TABLE public.client_audit_actions 
ALTER COLUMN notes TYPE text COLLATE "C",
ALTER COLUMN completion_notes TYPE text COLLATE "C";

-- Update general ledger transactions for Norwegian descriptions
ALTER TABLE public.general_ledger_transactions 
ALTER COLUMN description TYPE text COLLATE "C";

-- Update chart of accounts for Norwegian account names  
ALTER TABLE public.client_chart_of_accounts 
ALTER COLUMN account_name TYPE text COLLATE "C";

-- Create a function to fix encoding issues in existing data
CREATE OR REPLACE FUNCTION fix_norwegian_characters()
RETURNS integer AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Fix clients table Norwegian characters
  UPDATE public.clients
  SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    ceo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    ceo, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    chair = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    chair, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    current_auditor_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    current_auditor_name, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE name ~ '\?' OR ceo ~ '\?' OR chair ~ '\?' OR current_auditor_name ~ '\?';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Fix audit action templates
  UPDATE public.audit_action_templates
  SET title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    title, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    procedures = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    procedures, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE title ~ '\?' OR description ~ '\?' OR procedures ~ '\?';
  
  -- Fix general ledger transactions
  UPDATE public.general_ledger_transactions
  SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE description ~ '\?';
  
  -- Fix chart of accounts
  UPDATE public.client_chart_of_accounts
  SET account_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    account_name, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE account_name ~ '\?';
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;