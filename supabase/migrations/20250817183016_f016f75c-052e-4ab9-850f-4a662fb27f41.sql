-- Phase 5: Investment Holdings/Portfolios

-- Create investment portfolios table
CREATE TABLE public.investment_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  portfolio_name TEXT NOT NULL,
  portfolio_type TEXT NOT NULL DEFAULT 'general', -- general, pension, insurance, etc.
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT unique_portfolio_per_client UNIQUE(client_id, portfolio_name)
);

-- Create investment holdings table
CREATE TABLE public.investment_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.investment_portfolios(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES public.investment_securities(id),
  quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
  average_cost_price NUMERIC(15,4),
  cost_price_currency TEXT DEFAULT 'NOK',
  acquisition_date DATE,
  holding_type TEXT NOT NULL DEFAULT 'long', -- long, short
  cost_basis NUMERIC(15,2),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT unique_holding_per_portfolio UNIQUE(portfolio_id, security_id)
);

-- Create investment transactions table
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  holding_id UUID NOT NULL REFERENCES public.investment_holdings(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- buy, sell, dividend, split, merger
  transaction_date DATE NOT NULL,
  quantity NUMERIC(15,4) NOT NULL,
  price_per_unit NUMERIC(15,4),
  transaction_currency TEXT DEFAULT 'NOK',
  total_amount NUMERIC(15,2),
  fees NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  exchange_rate NUMERIC(10,6),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create portfolio valuations table for historical tracking
CREATE TABLE public.portfolio_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.investment_portfolios(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  total_market_value NUMERIC(15,2) NOT NULL,
  total_cost_basis NUMERIC(15,2),
  unrealized_gain_loss NUMERIC(15,2),
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  is_year_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT unique_portfolio_valuation_date UNIQUE(portfolio_id, valuation_date)
);

-- Enable RLS on all tables
ALTER TABLE public.investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_valuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_portfolios
CREATE POLICY "Users can view portfolios for their clients"
ON public.investment_portfolios FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create portfolios for their clients"
ON public.investment_portfolios FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update portfolios for their clients"
ON public.investment_portfolios FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete portfolios for their clients"
ON public.investment_portfolios FOR DELETE
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- RLS Policies for investment_holdings
CREATE POLICY "Users can view holdings for their portfolios"
ON public.investment_holdings FOR SELECT
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create holdings for their portfolios"
ON public.investment_holdings FOR INSERT
WITH CHECK (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update holdings for their portfolios"
ON public.investment_holdings FOR UPDATE
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete holdings for their portfolios"
ON public.investment_holdings FOR DELETE
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for investment_transactions
CREATE POLICY "Users can view transactions for their holdings"
ON public.investment_transactions FOR SELECT
USING (
  holding_id IN (
    SELECT ih.id FROM public.investment_holdings ih
    JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
    WHERE ip.client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create transactions for their holdings"
ON public.investment_transactions FOR INSERT
WITH CHECK (
  holding_id IN (
    SELECT ih.id FROM public.investment_holdings ih
    JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
    WHERE ip.client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update transactions for their holdings"
ON public.investment_transactions FOR UPDATE
USING (
  holding_id IN (
    SELECT ih.id FROM public.investment_holdings ih
    JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
    WHERE ip.client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete transactions for their holdings"
ON public.investment_transactions FOR DELETE
USING (
  holding_id IN (
    SELECT ih.id FROM public.investment_holdings ih
    JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
    WHERE ip.client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for portfolio_valuations
CREATE POLICY "Users can view valuations for their portfolios"
ON public.portfolio_valuations FOR SELECT
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create valuations for their portfolios"
ON public.portfolio_valuations FOR INSERT
WITH CHECK (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update valuations for their portfolios"
ON public.portfolio_valuations FOR UPDATE
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete valuations for their portfolios"
ON public.portfolio_valuations FOR DELETE
USING (
  portfolio_id IN (
    SELECT id FROM public.investment_portfolios 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_investment_portfolios_client_id ON public.investment_portfolios(client_id);
CREATE INDEX idx_investment_holdings_portfolio_id ON public.investment_holdings(portfolio_id);
CREATE INDEX idx_investment_holdings_security_id ON public.investment_holdings(security_id);
CREATE INDEX idx_investment_transactions_holding_id ON public.investment_transactions(holding_id);
CREATE INDEX idx_investment_transactions_date ON public.investment_transactions(transaction_date);
CREATE INDEX idx_portfolio_valuations_portfolio_id ON public.portfolio_valuations(portfolio_id);
CREATE INDEX idx_portfolio_valuations_date ON public.portfolio_valuations(valuation_date);

-- Create triggers for updated_at
CREATE TRIGGER update_investment_portfolios_updated_at
  BEFORE UPDATE ON public.investment_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_holdings_updated_at
  BEFORE UPDATE ON public.investment_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at
  BEFORE UPDATE ON public.investment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for current portfolio holdings with market values
CREATE VIEW public.current_portfolio_holdings AS
SELECT 
  ih.id,
  ih.portfolio_id,
  ip.portfolio_name,
  ip.client_id,
  ih.security_id,
  ise.name as security_name,
  ise.isin_code,
  ise.currency_code as security_currency,
  ih.quantity,
  ih.average_cost_price,
  ih.cost_price_currency,
  ih.cost_basis,
  lsp.closing_price as current_price,
  lsp.price_date as price_date,
  (ih.quantity * COALESCE(lsp.closing_price, 0)) as market_value,
  ((ih.quantity * COALESCE(lsp.closing_price, 0)) - COALESCE(ih.cost_basis, 0)) as unrealized_gain_loss,
  CASE 
    WHEN ih.cost_basis > 0 THEN 
      (((ih.quantity * COALESCE(lsp.closing_price, 0)) - ih.cost_basis) / ih.cost_basis * 100)
    ELSE 0
  END as return_percentage,
  ih.acquisition_date,
  ih.is_active,
  ih.created_at,
  ih.updated_at
FROM public.investment_holdings ih
JOIN public.investment_portfolios ip ON ih.portfolio_id = ip.id
JOIN public.investment_securities ise ON ih.security_id = ise.id
LEFT JOIN public.latest_security_prices lsp ON ise.id = lsp.security_id
WHERE ih.is_active = true AND ip.is_active = true;

-- Create view for portfolio summaries
CREATE VIEW public.portfolio_summaries AS
SELECT 
  ip.id as portfolio_id,
  ip.portfolio_name,
  ip.client_id,
  ip.portfolio_type,
  ip.currency_code,
  COUNT(ih.id) as total_holdings,
  SUM(COALESCE(ih.cost_basis, 0)) as total_cost_basis,
  SUM(ih.quantity * COALESCE(lsp.closing_price, 0)) as total_market_value,
  SUM((ih.quantity * COALESCE(lsp.closing_price, 0)) - COALESCE(ih.cost_basis, 0)) as total_unrealized_gain_loss,
  CASE 
    WHEN SUM(COALESCE(ih.cost_basis, 0)) > 0 THEN 
      (SUM((ih.quantity * COALESCE(lsp.closing_price, 0)) - COALESCE(ih.cost_basis, 0)) / SUM(ih.cost_basis) * 100)
    ELSE 0
  END as total_return_percentage,
  ip.created_at,
  ip.updated_at
FROM public.investment_portfolios ip
LEFT JOIN public.investment_holdings ih ON ip.id = ih.portfolio_id AND ih.is_active = true
LEFT JOIN public.investment_securities ise ON ih.security_id = ise.id
LEFT JOIN public.latest_security_prices lsp ON ise.id = lsp.security_id
WHERE ip.is_active = true
GROUP BY ip.id, ip.portfolio_name, ip.client_id, ip.portfolio_type, ip.currency_code, ip.created_at, ip.updated_at;