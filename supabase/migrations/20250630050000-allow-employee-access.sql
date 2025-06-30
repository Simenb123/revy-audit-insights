-- Expand admin policies to include employees

ALTER POLICY "Managers can view enrollments in their firm" ON public.user_learning_enrollments
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.audit_firm_id = p2.audit_firm_id
      WHERE p1.id = auth.uid()
      AND p2.id = user_id
      AND p1.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );
