-- Create report_templates table for user-defined report templates
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report templates" ON public.report_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report templates" ON public.report_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own report templates" ON public.report_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own report templates" ON public.report_templates
  FOR DELETE USING (auth.uid() = user_id);
