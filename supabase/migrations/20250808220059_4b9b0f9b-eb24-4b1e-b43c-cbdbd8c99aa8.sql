-- Add BRREG fields to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS mva_registered boolean,
  ADD COLUMN IF NOT EXISTS accountant_name text;

-- Optional: comments for documentation
COMMENT ON COLUMN public.clients.mva_registered IS 'Registered in VAT register (MVA) per BRREG)';
COMMENT ON COLUMN public.clients.accountant_name IS 'Registered accountant name from BRREG roles if available';