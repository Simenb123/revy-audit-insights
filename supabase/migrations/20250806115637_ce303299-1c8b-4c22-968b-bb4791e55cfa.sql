-- Create table for saved client reports
CREATE TABLE public.client_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_description TEXT,
  widgets_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  layout_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for client reports
CREATE POLICY "Users can view reports for their clients" 
ON public.client_reports 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR 
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "Users can create reports for their clients" 
ON public.client_reports 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND (
    client_id IN (
      SELECT c.id FROM clients c 
      WHERE c.department_id = get_user_department(auth.uid())
    ) OR 
    client_id IN (
      SELECT ct.client_id FROM client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    ) OR 
    get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  )
);

CREATE POLICY "Users can update their own reports" 
ON public.client_reports 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own reports" 
ON public.client_reports 
FOR DELETE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_reports_updated_at
BEFORE UPDATE ON public.client_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();