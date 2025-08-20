-- SECURITY FIX: Change ownership of views from postgres to authenticated role
-- Views owned by postgres superuser bypass RLS and create security vulnerabilities

-- Change ownership of all investment-related views to the authenticated role
-- This ensures they respect RLS policies instead of running with superuser privileges
ALTER VIEW public.current_portfolio_holdings OWNER TO authenticated;
ALTER VIEW public.latest_exchange_rates OWNER TO authenticated;
ALTER VIEW public.latest_security_prices OWNER TO authenticated;
ALTER VIEW public.portfolio_summaries OWNER TO authenticated;
ALTER VIEW public.year_end_exchange_rates OWNER TO authenticated;
ALTER VIEW public.year_end_security_prices OWNER TO authenticated;

-- Ensure the views have proper permissions for authenticated users
GRANT SELECT ON public.current_portfolio_holdings TO authenticated;
GRANT SELECT ON public.latest_exchange_rates TO authenticated;
GRANT SELECT ON public.latest_security_prices TO authenticated;
GRANT SELECT ON public.portfolio_summaries TO authenticated;
GRANT SELECT ON public.year_end_exchange_rates TO authenticated;
GRANT SELECT ON public.year_end_security_prices TO authenticated;

-- These views will now execute with the permissions of the 'authenticated' role
-- instead of the 'postgres' superuser, ensuring proper RLS enforcement