-- Create table for account mapping rules (intervals)
CREATE TABLE public.account_mapping_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  account_range_start INTEGER NOT NULL,
  account_range_end INTEGER NOT NULL,
  standard_account_id UUID NOT NULL,
  confidence_score NUMERIC DEFAULT 0.9,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for account mapping suggestions
CREATE TABLE public.account_mapping_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  client_account_id UUID NOT NULL,
  suggested_standard_account_id UUID NOT NULL,
  rule_id UUID REFERENCES public.account_mapping_rules(id),
  confidence_score NUMERIC DEFAULT 0.0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_mapping_rules
CREATE POLICY "Users can view mapping rules" 
ON public.account_mapping_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage mapping rules" 
ON public.account_mapping_rules 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles 
  WHERE user_role IN ('admin', 'partner', 'manager')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles 
  WHERE user_role IN ('admin', 'partner', 'manager')
));

-- RLS policies for account_mapping_suggestions
CREATE POLICY "Users can view suggestions for their clients" 
ON public.account_mapping_suggestions 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage suggestions for their clients" 
ON public.account_mapping_suggestions 
FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
))
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_account_mapping_rules_updated_at
  BEFORE UPDATE ON public.account_mapping_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_mapping_suggestions_updated_at
  BEFORE UPDATE ON public.account_mapping_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_account_mapping_rules_range ON public.account_mapping_rules(account_range_start, account_range_end);
CREATE INDEX idx_account_mapping_suggestions_client ON public.account_mapping_suggestions(client_id);
CREATE INDEX idx_account_mapping_suggestions_status ON public.account_mapping_suggestions(status);