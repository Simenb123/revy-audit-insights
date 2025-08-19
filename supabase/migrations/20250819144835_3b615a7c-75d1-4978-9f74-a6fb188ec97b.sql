-- Ensure all text columns use proper UTF8 collation for Norwegian characters
-- First, let's set the database to use UTF8 encoding explicitly

-- Update existing text columns that might have encoding issues
-- Focus on commonly used tables with Norwegian text

-- Update sample_reviews table
ALTER TABLE public.sample_reviews 
ALTER COLUMN deviation_comment TYPE text COLLATE "nb_NO.UTF-8";

-- Update clients table for Norwegian company names
ALTER TABLE public.clients 
ALTER COLUMN name TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN ceo TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN chair TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN current_auditor_name TYPE text COLLATE "nb_NO.UTF-8";

-- Update audit action templates for Norwegian descriptions
ALTER TABLE public.audit_action_templates 
ALTER COLUMN title TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN description TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN procedures TYPE text COLLATE "nb_NO.UTF-8";

-- Update client audit actions for Norwegian notes
ALTER TABLE public.client_audit_actions 
ALTER COLUMN notes TYPE text COLLATE "nb_NO.UTF-8",
ALTER COLUMN completion_notes TYPE text COLLATE "nb_NO.UTF-8";

-- Update general ledger transactions for Norwegian descriptions
ALTER TABLE public.general_ledger_transactions 
ALTER COLUMN description TYPE text COLLATE "nb_NO.UTF-8";

-- Update chart of accounts for Norwegian account names
ALTER TABLE public.client_chart_of_accounts 
ALTER COLUMN account_name TYPE text COLLATE "nb_NO.UTF-8";

-- Create a function to fix encoding issues in existing data
CREATE OR REPLACE FUNCTION fix_norwegian_characters()
RETURNS void AS $$
BEGIN
  -- Fix common encoding issues where Norwegian characters appear as ?
  -- This function will attempt to restore corrupted Norwegian characters
  
  -- Update sample_reviews
  UPDATE public.sample_reviews 
  SET deviation_comment = REPLACE(REPLACE(REPLACE(
    deviation_comment, '?', 'æ'), '?', 'ø'), '?', 'å')
  WHERE deviation_comment ~ '\?';
  
  -- Update clients  
  UPDATE public.clients
  SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    ceo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    ceo, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    chair = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    chair, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE name ~ '\?' OR ceo ~ '\?' OR chair ~ '\?';
  
  -- Update audit action templates
  UPDATE public.audit_action_templates
  SET title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    title, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å'),
    procedures = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    procedures, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE title ~ '\?' OR description ~ '\?' OR procedures ~ '\?';
  
  -- Update general ledger transactions
  UPDATE public.general_ledger_transactions
  SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE description ~ '\?';
  
  -- Update chart of accounts
  UPDATE public.client_chart_of_accounts
  SET account_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    account_name, '?', 'æ'), '?', 'ø'), '?', 'å'), '?', 'Æ'), '?', 'Ø'), '?', 'Å')
  WHERE account_name ~ '\?';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;