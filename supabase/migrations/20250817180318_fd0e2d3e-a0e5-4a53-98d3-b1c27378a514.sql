-- Create currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL UNIQUE,
  currency_name TEXT NOT NULL,
  symbol TEXT,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_base_currency BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exchange rates table
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency_code TEXT NOT NULL,
  to_currency_code TEXT NOT NULL DEFAULT 'NOK',
  rate_date DATE NOT NULL,
  exchange_rate NUMERIC(18,8) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_reference TEXT,
  is_year_end BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create unique constraint for exchange rates
CREATE UNIQUE INDEX idx_exchange_rates_unique 
ON public.exchange_rates(from_currency_code, to_currency_code, rate_date);

-- Create indexes for efficient querying
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(rate_date);
CREATE INDEX idx_exchange_rates_currency ON public.exchange_rates(from_currency_code);
CREATE INDEX idx_exchange_rates_year_end ON public.exchange_rates(is_year_end, rate_date);

-- RLS Policies for currencies
CREATE POLICY "Everyone can view currencies" 
ON public.currencies 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage currencies" 
ON public.currencies 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for exchange_rates
CREATE POLICY "Everyone can view exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create exchange rates" 
ON public.exchange_rates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own exchange rates" 
ON public.exchange_rates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own exchange rates" 
ON public.exchange_rates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add triggers for updated_at
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial currencies
INSERT INTO public.currencies (currency_code, currency_name, symbol, decimal_places, is_base_currency) VALUES
('NOK', 'Norske kroner', 'kr', 2, true),
('USD', 'US Dollar', '$', 2, false),
('EUR', 'Euro', '€', 2, false),
('SEK', 'Svenska kronor', 'kr', 2, false),
('DKK', 'Danske kroner', 'kr', 2, false),
('GBP', 'Britiske pund', '£', 2, false),
('CHF', 'Sveitsiske franc', 'CHF', 2, false),
('JPY', 'Japanske yen', '¥', 0, false),
('CAD', 'Kanadiske dollar', 'C$', 2, false),
('AUD', 'Australske dollar', 'A$', 2, false);

-- Create view for latest exchange rates
CREATE VIEW public.latest_exchange_rates AS
SELECT DISTINCT ON (from_currency_code, to_currency_code) 
  from_currency_code,
  to_currency_code,
  rate_date,
  exchange_rate,
  source,
  is_year_end
FROM public.exchange_rates 
ORDER BY from_currency_code, to_currency_code, rate_date DESC;

-- Create view for year-end exchange rates
CREATE VIEW public.year_end_exchange_rates AS
SELECT 
  from_currency_code,
  to_currency_code,
  EXTRACT(YEAR FROM rate_date) as year,
  rate_date,
  exchange_rate,
  source
FROM public.exchange_rates 
WHERE is_year_end = true
ORDER BY from_currency_code, to_currency_code, rate_date DESC;

-- Create function to get exchange rate for a specific date
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT DEFAULT 'NOK',
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC(18,8)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT exchange_rate
  FROM public.exchange_rates
  WHERE from_currency_code = p_from_currency
    AND to_currency_code = p_to_currency
    AND rate_date <= p_date
  ORDER BY rate_date DESC
  LIMIT 1;
$$;

-- Create function to convert amount between currencies
CREATE OR REPLACE FUNCTION public.convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT DEFAULT 'NOK',
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC(18,8)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    CASE 
      WHEN p_from_currency = p_to_currency THEN p_amount
      ELSE p_amount * COALESCE(public.get_exchange_rate(p_from_currency, p_to_currency, p_date), 0)
    END;
$$;