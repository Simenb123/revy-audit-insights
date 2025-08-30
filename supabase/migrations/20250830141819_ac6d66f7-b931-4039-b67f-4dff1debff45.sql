-- Clean slate: Delete all existing shareholder data for fresh import
-- This will remove all companies, holdings, and entities to start over

DELETE FROM public.share_holdings;
DELETE FROM public.share_companies; 
DELETE FROM public.share_entities;

-- Reset any sequences if they exist
-- This ensures we start fresh with clean IDs