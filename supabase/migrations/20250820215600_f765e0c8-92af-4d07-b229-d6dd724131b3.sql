-- SECURITY FIX: Recreate views with SECURITY INVOKER to prevent bypass of RLS
-- This ensures views run with the permissions of the querying user, not the view creator

-- Drop existing views that have security definer issues
DROP VIEW IF EXISTS public.current_portfolio_holdings CASCADE;
DROP VIEW IF EXISTS public.latest_exchange_rates CASCADE;
DROP VIEW IF EXISTS public.latest_security_prices CASCADE;
DROP VIEW IF EXISTS public.portfolio_summaries CASCADE;
DROP VIEW IF EXISTS public.year_end_exchange_rates CASCADE;
DROP VIEW IF EXISTS public.year_end_security_prices CASCADE;

-- Recreate views with explicit SECURITY INVOKER
-- This ensures they respect RLS policies of the querying user

CREATE VIEW public.latest_exchange_rates 
WITH (security_invoker = true) AS
SELECT DISTINCT ON (from_currency_code, to_currency_code) 
    from_currency_code,
    to_currency_code,
    rate_date,
    exchange_rate,
    source,
    is_year_end
FROM public.exchange_rates
ORDER BY from_currency_code, to_currency_code, rate_date DESC;

CREATE VIEW public.latest_security_prices 
WITH (security_invoker = true) AS
SELECT DISTINCT ON (security_id) 
    security_id,
    price_date,
    closing_price,
    currency_code,
    source,
    is_year_end
FROM public.historical_prices
ORDER BY security_id, price_date DESC;

CREATE VIEW public.year_end_exchange_rates 
WITH (security_invoker = true) AS
SELECT 
    from_currency_code,
    to_currency_code,
    EXTRACT(year FROM rate_date) AS year,
    rate_date,
    exchange_rate,
    source
FROM public.exchange_rates
WHERE is_year_end = true
ORDER BY from_currency_code, to_currency_code, rate_date DESC;

CREATE VIEW public.year_end_security_prices 
WITH (security_invoker = true) AS
SELECT 
    security_id,
    EXTRACT(year FROM price_date) AS year,
    price_date,
    closing_price,
    currency_code,
    source
FROM public.historical_prices
WHERE is_year_end = true
ORDER BY security_id, price_date DESC;

CREATE VIEW public.current_portfolio_holdings 
WITH (security_invoker = true) AS
SELECT 
    ih.id,
    ih.portfolio_id,
    ip.portfolio_name,
    ip.client_id,
    ih.security_id,
    ise.name AS security_name,
    ise.isin_code,
    ise.currency_code AS security_currency,
    ih.quantity,
    ih.average_cost_price,
    ih.cost_price_currency,
    ih.cost_basis,
    lsp.closing_price AS current_price,
    lsp.price_date,
    (ih.quantity * COALESCE(lsp.closing_price, 0::numeric)) AS market_value,
    ((ih.quantity * COALESCE(lsp.closing_price, 0::numeric)) - COALESCE(ih.cost_basis, 0::numeric)) AS unrealized_gain_loss,
    CASE
        WHEN (ih.cost_basis > 0::numeric) THEN ((((ih.quantity * COALESCE(lsp.closing_price, 0::numeric)) - ih.cost_basis) / ih.cost_basis) * 100::numeric)
        ELSE 0::numeric
    END AS return_percentage,
    ih.acquisition_date,
    ih.is_active,
    ih.created_at,
    ih.updated_at
FROM public.investment_holdings ih
JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
JOIN public.investment_securities ise ON ih.security_id = ise.id
LEFT JOIN public.latest_security_prices lsp ON ise.id = lsp.security_id
WHERE ih.is_active = true AND ip.is_active = true;

CREATE VIEW public.portfolio_summaries 
WITH (security_invoker = true) AS
SELECT 
    ip.id AS portfolio_id,
    ip.portfolio_name,
    ip.client_id,
    ip.portfolio_type,
    ip.currency_code,
    COUNT(ih.id) AS total_holdings,
    SUM(COALESCE(ih.cost_basis, 0::numeric)) AS total_cost_basis,
    SUM((ih.quantity * COALESCE(lsp.closing_price, 0::numeric))) AS total_market_value,
    SUM(((ih.quantity * COALESCE(lsp.closing_price, 0::numeric)) - COALESCE(ih.cost_basis, 0::numeric))) AS total_unrealized_gain_loss,
    CASE
        WHEN (SUM(COALESCE(ih.cost_basis, 0::numeric)) > 0::numeric) THEN ((SUM(((ih.quantity * COALESCE(lsp.closing_price, 0::numeric)) - COALESCE(ih.cost_basis, 0::numeric))) / SUM(ih.cost_basis)) * 100::numeric)
        ELSE 0::numeric
    END AS total_return_percentage,
    ip.created_at,
    ip.updated_at
FROM public.investment_portfolios ip
LEFT JOIN public.investment_holdings ih ON (ip.id = ih.portfolio_id AND ih.is_active = true)
LEFT JOIN public.investment_securities ise ON ih.security_id = ise.id
LEFT JOIN public.latest_security_prices lsp ON ise.id = lsp.security_id
WHERE ip.is_active = true
GROUP BY ip.id, ip.portfolio_name, ip.client_id, ip.portfolio_type, ip.currency_code, ip.created_at, ip.updated_at;

-- Grant appropriate permissions
GRANT SELECT ON public.latest_exchange_rates TO authenticated;
GRANT SELECT ON public.latest_security_prices TO authenticated;
GRANT SELECT ON public.year_end_exchange_rates TO authenticated;
GRANT SELECT ON public.year_end_security_prices TO authenticated;
GRANT SELECT ON public.current_portfolio_holdings TO authenticated;
GRANT SELECT ON public.portfolio_summaries TO authenticated;

-- These views now use SECURITY INVOKER which ensures they respect RLS policies
-- of the querying user instead of bypassing them with superuser privileges