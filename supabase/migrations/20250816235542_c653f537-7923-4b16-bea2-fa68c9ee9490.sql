-- Create enums for payroll data
CREATE TYPE public.payroll_aga_type AS ENUM ('loenn', 'pensjon', 'fradragSone');

-- Payroll imports metadata table
CREATE TABLE public.payroll_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  file_name TEXT,
  avstemmingstidspunkt TIMESTAMPTZ,
  fom_kalendermaaned TEXT,
  tom_kalendermaaned TEXT,
  orgnr TEXT,
  navn TEXT,
  antall_personer_innrapportert INTEGER,
  antall_personer_unike INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, period_key)
);

-- Payroll submissions (monthly submissions)
CREATE TABLE public.payroll_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  kalendermaaned TEXT,
  status TEXT,
  kildesystem TEXT,
  altinn_referanse TEXT,
  innsendings_id TEXT,
  meldings_id TEXT,
  leveringstidspunkt TIMESTAMPTZ,
  tidsstempel_fra_altinn TIMESTAMPTZ,
  antall_inntektsmottakere INTEGER DEFAULT 0,
  sum_aga NUMERIC DEFAULT 0,
  sum_forskuddstrekk NUMERIC DEFAULT 0,
  kontonummer TEXT,
  kid_aga TEXT,
  kid_trekk TEXT,
  kid_finansskatt TEXT,
  forfallsdato DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll companies
CREATE TABLE public.payroll_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  orgnr TEXT,
  navn TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll recipients (employees)
CREATE TABLE public.payroll_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.payroll_companies(id) ON DELETE CASCADE,
  ansattnummer TEXT,
  foedselsdato DATE,
  navn TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll employments
CREATE TABLE public.payroll_employments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.payroll_recipients(id) ON DELETE CASCADE,
  type TEXT,
  startdato DATE,
  sluttdato DATE,
  stillingsprosent NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll leaves (permissions)
CREATE TABLE public.payroll_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  employment_id UUID NOT NULL REFERENCES public.payroll_employments(id) ON DELETE CASCADE,
  beskrivelse TEXT,
  start_dato DATE,
  slutt_dato DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll income
CREATE TABLE public.payroll_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.payroll_recipients(id) ON DELETE CASCADE,
  beloep NUMERIC NOT NULL DEFAULT 0,
  fordel TEXT,
  trekkpliktig BOOLEAN DEFAULT false,
  aga_pliktig BOOLEAN DEFAULT false,
  beskrivelse TEXT,
  antall NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll tax deductions
CREATE TABLE public.payroll_tax_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.payroll_recipients(id) ON DELETE CASCADE,
  beloep NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll deductions
CREATE TABLE public.payroll_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.payroll_recipients(id) ON DELETE CASCADE,
  beskrivelse TEXT,
  beloep NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll employer contributions (AGA)
CREATE TABLE public.payroll_employer_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  sone TEXT NOT NULL,
  type payroll_aga_type NOT NULL,
  beregningskode TEXT,
  grunnlag NUMERIC NOT NULL DEFAULT 0,
  prosentsats NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll pensions
CREATE TABLE public.payroll_pensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  identifikator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll variables (calculated metrics)
CREATE TABLE public.payroll_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.payroll_imports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(import_id, name)
);

-- Enable RLS on all tables
ALTER TABLE public.payroll_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employer_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_pensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_imports
CREATE POLICY "Users can manage payroll imports for their clients"
ON public.payroll_imports
FOR ALL
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR 
  client_id IN (
    SELECT ct.client_id FROM public.client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR 
  client_id IN (
    SELECT ct.client_id FROM public.client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- RLS Policies for all other payroll tables (inherit access via import_id)
CREATE POLICY "Users can access payroll data through imports"
ON public.payroll_submissions
FOR ALL
USING (
  import_id IN (
    SELECT pi.id FROM public.payroll_imports pi
    WHERE pi.client_id IN (
      SELECT c.id FROM public.clients c 
      WHERE c.department_id = get_user_department(auth.uid())
    ) OR 
    pi.client_id IN (
      SELECT ct.client_id FROM public.client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    ) OR 
    get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  )
)
WITH CHECK (
  import_id IN (
    SELECT pi.id FROM public.payroll_imports pi
    WHERE pi.client_id IN (
      SELECT c.id FROM public.clients c 
      WHERE c.department_id = get_user_department(auth.uid())
    ) OR 
    pi.client_id IN (
      SELECT ct.client_id FROM public.client_teams ct 
      WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
    ) OR 
    get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  )
);

-- Copy the same policy pattern for all other tables
CREATE POLICY "Users can access payroll companies through imports"
ON public.payroll_companies FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll recipients through imports"
ON public.payroll_recipients FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll employments through imports"
ON public.payroll_employments FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll leaves through imports"
ON public.payroll_leaves FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll income through imports"
ON public.payroll_income FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll tax deductions through imports"
ON public.payroll_tax_deductions FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll deductions through imports"
ON public.payroll_deductions FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll employer contributions through imports"
ON public.payroll_employer_contributions FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll pensions through imports"
ON public.payroll_pensions FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can access payroll variables through imports"
ON public.payroll_variables FOR ALL USING (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
) WITH CHECK (
  import_id IN (SELECT pi.id FROM public.payroll_imports pi WHERE pi.client_id IN (
    SELECT c.id FROM public.clients c WHERE c.department_id = get_user_department(auth.uid())
  ) OR pi.client_id IN (
    SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

-- Add indexes for performance
CREATE INDEX idx_payroll_imports_client_period ON public.payroll_imports(client_id, period_key);
CREATE INDEX idx_payroll_submissions_import ON public.payroll_submissions(import_id);
CREATE INDEX idx_payroll_companies_import ON public.payroll_companies(import_id);
CREATE INDEX idx_payroll_recipients_import ON public.payroll_recipients(import_id);
CREATE INDEX idx_payroll_recipients_company ON public.payroll_recipients(company_id);
CREATE INDEX idx_payroll_employments_import ON public.payroll_employments(import_id);
CREATE INDEX idx_payroll_employments_recipient ON public.payroll_employments(recipient_id);
CREATE INDEX idx_payroll_leaves_employment ON public.payroll_leaves(employment_id);
CREATE INDEX idx_payroll_income_recipient ON public.payroll_income(recipient_id);
CREATE INDEX idx_payroll_tax_deductions_recipient ON public.payroll_tax_deductions(recipient_id);
CREATE INDEX idx_payroll_deductions_recipient ON public.payroll_deductions(recipient_id);
CREATE INDEX idx_payroll_variables_import_name ON public.payroll_variables(import_id, name);

-- Add triggers for updated_at
CREATE TRIGGER update_payroll_imports_updated_at
  BEFORE UPDATE ON public.payroll_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();