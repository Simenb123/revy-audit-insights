-- Create account_categories table
CREATE TABLE public.account_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_system_category BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_groups table  
CREATE TABLE public.analysis_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_system_group BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for account_categories
CREATE POLICY "Everyone can view account categories" 
ON public.account_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage account categories" 
ON public.account_categories 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create policies for analysis_groups
CREATE POLICY "Everyone can view analysis groups" 
ON public.analysis_groups 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage analysis groups" 
ON public.analysis_groups 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE TRIGGER update_account_categories_updated_at
BEFORE UPDATE ON public.account_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_groups_updated_at
BEFORE UPDATE ON public.analysis_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.account_categories (name, description, is_system_category) VALUES
('Lønnsomhet', 'Kategorier relatert til lønnsomhetsanalyse', true),
('Likviditet', 'Kategorier relatert til likviditetsanalyse', true),
('Soliditet', 'Kategorier relatert til soliditetsanalyse', true),
('Effektivitet', 'Kategorier relatert til effektivitetsanalyse', true),
('Vekst', 'Kategorier relatert til vekstanalyse', true);

INSERT INTO public.analysis_groups (name, description, category, is_system_group) VALUES
('Bruttofortjeneste', 'Analyse av bruttofortjeneste og marginer', 'Lønnsomhet', true),
('Driftsresultat', 'Analyse av driftsresultat og driftsmarginer', 'Lønnsomhet', true),
('Arbeidskapital', 'Analyse av arbeidskapital og omløpshastighet', 'Likviditet', true),
('Egenkapitalandel', 'Analyse av egenkapitalandel og soliditet', 'Soliditet', true),
('Gjeldsgrad', 'Analyse av gjeldsgrad og finansiering', 'Soliditet', true),
('Omsetningsvekst', 'Analyse av omsetningsvekst og utvikling', 'Vekst', true),
('Kundevekst', 'Analyse av kundevekst og markedsandeler', 'Vekst', true);