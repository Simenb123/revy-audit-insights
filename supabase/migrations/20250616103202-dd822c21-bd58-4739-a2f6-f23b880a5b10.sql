
-- Create table for AI prompt configurations
CREATE TABLE public.ai_prompt_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_prompt TEXT NOT NULL,
  context_prompts JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI prompt history
CREATE TABLE public.ai_prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  configuration_id UUID REFERENCES public.ai_prompt_configurations,
  base_prompt TEXT NOT NULL,
  context_prompts JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompt_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_history ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_prompt_configurations
CREATE POLICY "Users can view prompt configurations" 
  ON public.ai_prompt_configurations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert prompt configurations" 
  ON public.ai_prompt_configurations 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prompt configurations" 
  ON public.ai_prompt_configurations 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Create policies for ai_prompt_history
CREATE POLICY "Users can view prompt history" 
  ON public.ai_prompt_history 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert prompt history" 
  ON public.ai_prompt_history 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_ai_prompt_configurations
  BEFORE UPDATE ON public.ai_prompt_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
