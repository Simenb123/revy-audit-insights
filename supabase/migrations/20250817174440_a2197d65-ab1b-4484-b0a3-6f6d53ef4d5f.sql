-- Create historical prices table for investment securities
CREATE TABLE public.historical_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  security_id UUID NOT NULL REFERENCES public.investment_securities(id) ON DELETE CASCADE,
  price_date DATE NOT NULL,
  closing_price NUMERIC(18,6) NOT NULL,
  opening_price NUMERIC(18,6),
  high_price NUMERIC(18,6),
  low_price NUMERIC(18,6),
  volume BIGINT,
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  source TEXT NOT NULL DEFAULT 'manual',
  source_reference TEXT,
  is_year_end BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to prevent duplicate prices for same security and date
CREATE UNIQUE INDEX idx_historical_prices_security_date 
ON public.historical_prices(security_id, price_date);

-- Create index for efficient querying
CREATE INDEX idx_historical_prices_date ON public.historical_prices(price_date);
CREATE INDEX idx_historical_prices_year_end ON public.historical_prices(is_year_end, price_date);

-- RLS Policies for historical_prices
CREATE POLICY "Everyone can view historical prices" 
ON public.historical_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create historical prices" 
ON public.historical_prices 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own historical prices" 
ON public.historical_prices 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own historical prices" 
ON public.historical_prices 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_historical_prices_updated_at
  BEFORE UPDATE ON public.historical_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for latest prices per security
CREATE VIEW public.latest_security_prices AS
SELECT DISTINCT ON (security_id) 
  security_id,
  price_date,
  closing_price,
  currency_code,
  source,
  is_year_end
FROM public.historical_prices 
ORDER BY security_id, price_date DESC;

-- Create view for year-end prices specifically
CREATE VIEW public.year_end_security_prices AS
SELECT 
  security_id,
  EXTRACT(YEAR FROM price_date) as year,
  price_date,
  closing_price,
  currency_code,
  source
FROM public.historical_prices 
WHERE is_year_end = true
ORDER BY security_id, price_date DESC;