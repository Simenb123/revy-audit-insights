-- Add missing unique index for share_entities to support ON CONFLICT (entity_key, user_id)
-- This will resolve the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- Drop the old unique index that only covers entity_key
DROP INDEX IF EXISTS share_entities_entity_key_key;

-- Create new unique index that covers both entity_key and user_id to match the ON CONFLICT clause
CREATE UNIQUE INDEX share_entities_entity_key_user_id_key ON share_entities (entity_key, user_id);

-- Verify all three tables now have matching unique indexes for their ON CONFLICT clauses:
-- share_companies: (orgnr, year, user_id) - already exists
-- share_entities: (entity_key, user_id) - created above  
-- share_holdings: (company_orgnr, holder_id, share_class, year, user_id) - already exists