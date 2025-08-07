-- Add partner and ansv columns to clients table
ALTER TABLE clients 
ADD COLUMN partner text,
ADD COLUMN ansv text;