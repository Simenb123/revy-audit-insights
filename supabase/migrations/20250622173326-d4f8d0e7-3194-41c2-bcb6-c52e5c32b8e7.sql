
-- Enable Row Level Security on audit_action_templates table
ALTER TABLE public.audit_action_templates ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own audit action templates
CREATE POLICY "Users can create audit action templates" 
  ON public.audit_action_templates 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

-- Allow users to view audit action templates
CREATE POLICY "Users can view audit action templates" 
  ON public.audit_action_templates 
  FOR SELECT 
  USING (
    is_system_template = true OR 
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

-- Allow users to update their own audit action templates
CREATE POLICY "Users can update their own audit action templates" 
  ON public.audit_action_templates 
  FOR UPDATE 
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

-- Allow users to delete their own audit action templates
CREATE POLICY "Users can delete their own audit action templates" 
  ON public.audit_action_templates 
  FOR DELETE 
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );
