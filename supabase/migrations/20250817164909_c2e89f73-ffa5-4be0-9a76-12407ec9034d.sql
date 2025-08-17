-- Create country risk classifications table
CREATE TABLE public.country_risk_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  exemption_method_risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (exemption_method_risk_level IN ('low', 'medium', 'high')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investment securities (global database)
CREATE TABLE public.investment_securities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  isin_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  security_type TEXT NOT NULL DEFAULT 'stock',
  country_code TEXT,
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  exchange TEXT,
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create client investments table
CREATE TABLE public.client_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  security_id UUID NOT NULL REFERENCES public.investment_securities(id),
  current_quantity NUMERIC(18,6) NOT NULL DEFAULT 0,
  average_cost_price NUMERIC(18,6),
  total_cost_basis NUMERIC(18,6),
  current_market_value NUMERIC(18,6),
  last_valuation_date DATE,
  portfolio_percentage NUMERIC(5,2),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create investment transactions table
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  security_id UUID NOT NULL REFERENCES public.investment_securities(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'split', 'merger', 'other')),
  transaction_date DATE NOT NULL,
  quantity NUMERIC(18,6) NOT NULL,
  price_per_unit NUMERIC(18,6) NOT NULL,
  total_amount NUMERIC(18,6) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  exchange_rate NUMERIC(18,6) DEFAULT 1.0,
  fees NUMERIC(18,6) DEFAULT 0,
  tax_withheld NUMERIC(18,6) DEFAULT 0,
  notes TEXT,
  voucher_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.country_risk_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for country_risk_classifications
CREATE POLICY "Everyone can view country risk classifications" 
ON public.country_risk_classifications 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage country risk classifications" 
ON public.country_risk_classifications 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for investment_securities
CREATE POLICY "Everyone can view investment securities" 
ON public.investment_securities 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create investment securities" 
ON public.investment_securities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own investment securities" 
ON public.investment_securities 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for client_investments
CREATE POLICY "Users can manage investments for their firm's clients" 
ON public.client_investments 
FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    )
  )
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    )
  )
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- RLS Policies for investment_transactions
CREATE POLICY "Users can manage transactions for their firm's clients" 
ON public.investment_transactions 
FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    )
  )
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    )
  )
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Add triggers for updated_at
CREATE TRIGGER update_country_risk_classifications_updated_at
  BEFORE UPDATE ON public.country_risk_classifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_securities_updated_at
  BEFORE UPDATE ON public.investment_securities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_investments_updated_at
  BEFORE UPDATE ON public.client_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at
  BEFORE UPDATE ON public.investment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial country risk classifications
INSERT INTO public.country_risk_classifications (country_code, country_name, exemption_method_risk_level, description) VALUES
('NO', 'Norge', 'low', 'Lav risiko for å være utenfor fritaksmetoden'),
('SE', 'Sverige', 'low', 'Lav risiko for å være utenfor fritaksmetoden'),
('DK', 'Danmark', 'low', 'Lav risiko for å være utenfor fritaksmetoden'),
('US', 'USA', 'medium', 'Medium risiko for å være utenfor fritaksmetoden'),
('GB', 'Storbritannia', 'medium', 'Medium risiko for å være utenfor fritaksmetoden'),
('BM', 'Bermuda', 'high', 'Høy risiko for å være utenfor fritaksmetoden'),
('KY', 'Cayman Islands', 'high', 'Høy risiko for å være utenfor fritaksmetoden'),
('LU', 'Luxembourg', 'medium', 'Medium risiko for å være utenfor fritaksmetoden');