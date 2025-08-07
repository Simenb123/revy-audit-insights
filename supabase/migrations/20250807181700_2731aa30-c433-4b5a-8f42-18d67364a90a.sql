-- Add client_group column to clients table
ALTER TABLE public.clients 
ADD COLUMN client_group TEXT;