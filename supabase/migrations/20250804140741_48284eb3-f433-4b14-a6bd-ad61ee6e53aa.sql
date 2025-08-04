-- Create report_layouts table for interactive report builder
CREATE TABLE public.report_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout_json JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_layouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage layouts for their clients" 
ON public.report_layouts 
FOR ALL 
USING (user_owns_client(client_id))
WITH CHECK (user_owns_client(client_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_report_layouts_updated_at
BEFORE UPDATE ON public.report_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();