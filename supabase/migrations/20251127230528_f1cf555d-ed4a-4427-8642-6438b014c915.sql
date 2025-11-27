-- Step 1: Clean up existing duplicates, keeping only the oldest action per (client_id, template_id)
-- First, identify and delete duplicate rows
DELETE FROM client_audit_actions
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY client_id, template_id 
             ORDER BY created_at ASC
           ) as row_num
    FROM client_audit_actions
    WHERE template_id IS NOT NULL
  ) t
  WHERE t.row_num > 1
);

-- Step 2: Add UNIQUE constraint to prevent future duplicates
-- This allows only one action per template per client
-- NULL template_id values (manual actions) can still have multiple entries
ALTER TABLE client_audit_actions 
ADD CONSTRAINT client_audit_actions_client_template_unique 
UNIQUE (client_id, template_id);