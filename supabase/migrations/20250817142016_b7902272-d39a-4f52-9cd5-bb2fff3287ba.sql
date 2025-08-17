-- Create global A07 mapping rules table
CREATE TABLE public.global_a07_mapping_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  account_range_start INTEGER NOT NULL,
  account_range_end INTEGER NOT NULL,
  a07_performance_code TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0.9,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_a07_mapping_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for global A07 mapping rules
CREATE POLICY "Admins can manage global A07 mapping rules" 
ON public.global_a07_mapping_rules 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.user_role = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.user_role = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  )
);

CREATE POLICY "Users can view global A07 mapping rules" 
ON public.global_a07_mapping_rules 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_global_a07_mapping_rules_updated_at
  BEFORE UPDATE ON public.global_a07_mapping_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default A07 mapping rules based on common Norwegian chart of accounts
INSERT INTO public.global_a07_mapping_rules (rule_name, account_range_start, account_range_end, a07_performance_code, confidence_score) VALUES
('Lønnskostnader', 5000, 5999, '5700', 0.95),
('Arbeidsgiveravgift', 5800, 5899, '5771', 0.90),
('Pensjonskostnader', 6000, 6099, '5740', 0.85),
('Andre personalkostnader', 6100, 6299, '5790', 0.80),
('Ferielønn og feriepenger', 5400, 5499, '5710', 0.90),
('Overtidstillegg', 5200, 5299, '5720', 0.85);