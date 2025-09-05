-- Create table for storing mapping suggestions and user feedback
CREATE TABLE IF NOT EXISTS public.account_mapping_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  suggested_code TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'fuzzy', 'keyword', 'learned', 'amount')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  user_approved BOOLEAN,
  user_feedback TEXT,
  original_amount DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.account_mapping_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mapping suggestions" 
ON public.account_mapping_suggestions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create mapping suggestions" 
ON public.account_mapping_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mapping suggestions" 
ON public.account_mapping_suggestions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_account_mapping_suggestions_client_id ON public.account_mapping_suggestions(client_id);
CREATE INDEX idx_account_mapping_suggestions_account_number ON public.account_mapping_suggestions(account_number);
CREATE INDEX idx_account_mapping_suggestions_match_type ON public.account_mapping_suggestions(match_type);
CREATE INDEX idx_account_mapping_suggestions_approved ON public.account_mapping_suggestions(user_approved) WHERE user_approved IS NOT NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_account_mapping_suggestions_updated_at
BEFORE UPDATE ON public.account_mapping_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();