-- Create tables for payroll reconciliation persistence

-- Table for storing reconciliation sessions/history
CREATE TABLE public.payroll_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  payroll_import_id UUID,
  trial_balance_id UUID,
  reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_items INTEGER NOT NULL DEFAULT 0,
  perfect_matches INTEGER NOT NULL DEFAULT 0,
  minor_discrepancies INTEGER NOT NULL DEFAULT 0,
  major_discrepancies INTEGER NOT NULL DEFAULT 0,
  total_discrepancy_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  match_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  account_coverage DECIMAL(5,2) NOT NULL DEFAULT 0,
  data_quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved', 'rejected')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing reconciliation notes and approvals
CREATE TABLE public.reconciliation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_id UUID NOT NULL REFERENCES public.payroll_reconciliations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_description TEXT NOT NULL,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'approval', 'rejection')),
  author_name TEXT NOT NULL DEFAULT 'System User',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing detailed reconciliation items for history
CREATE TABLE public.reconciliation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_id UUID NOT NULL REFERENCES public.payroll_reconciliations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  payroll_amount DECIMAL(15,2),
  gl_amount DECIMAL(15,2),
  discrepancy DECIMAL(15,2),
  status TEXT NOT NULL CHECK (status IN ('match', 'minor_discrepancy', 'major_discrepancy')),
  accounts JSONB NOT NULL DEFAULT '[]',
  mapping_rules_applied JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_items ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now, can be restricted later when auth is implemented)
CREATE POLICY "Allow all operations on payroll_reconciliations" 
ON public.payroll_reconciliations 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on reconciliation_notes" 
ON public.reconciliation_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on reconciliation_items" 
ON public.reconciliation_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_payroll_reconciliations_client_date ON public.payroll_reconciliations(client_id, reconciliation_date DESC);
CREATE INDEX idx_reconciliation_notes_reconciliation_id ON public.reconciliation_notes(reconciliation_id);
CREATE INDEX idx_reconciliation_items_reconciliation_id ON public.reconciliation_items(reconciliation_id);
CREATE INDEX idx_reconciliation_notes_item_code ON public.reconciliation_notes(item_code);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_reconciliations_updated_at
BEFORE UPDATE ON public.payroll_reconciliations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();