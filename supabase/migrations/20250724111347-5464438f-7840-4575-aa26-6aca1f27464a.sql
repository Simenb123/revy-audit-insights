-- Add hierarchical fields to standard_accounts table
ALTER TABLE public.standard_accounts 
ADD COLUMN parent_line_id uuid REFERENCES public.standard_accounts(id),
ADD COLUMN calculation_formula text,
ADD COLUMN line_type text NOT NULL DEFAULT 'detail',
ADD COLUMN display_order integer NOT NULL DEFAULT 0,
ADD COLUMN is_total_line boolean NOT NULL DEFAULT false,
ADD COLUMN sign_multiplier integer NOT NULL DEFAULT 1;

-- Add constraint for line_type
ALTER TABLE public.standard_accounts 
ADD CONSTRAINT check_line_type 
CHECK (line_type IN ('detail', 'subtotal', 'calculation'));

-- Add constraint for sign_multiplier
ALTER TABLE public.standard_accounts 
ADD CONSTRAINT check_sign_multiplier 
CHECK (sign_multiplier IN (-1, 1));

-- Create index for better performance on hierarchical queries
CREATE INDEX idx_standard_accounts_parent_line_id ON public.standard_accounts(parent_line_id);
CREATE INDEX idx_standard_accounts_display_order ON public.standard_accounts(display_order);

-- Insert the complete financial statement structure
INSERT INTO public.standard_accounts (regnskapslinjenummer, standard_name, account_type, line_type, display_order, is_total_line, sign_multiplier) VALUES
(10, 'Salgsinntekt', 'revenue', 'detail', 10, false, 1),
(15, 'Annen driftsinntekt', 'revenue', 'detail', 15, false, 1),
(19, 'Sum driftsinntekter', 'revenue', 'subtotal', 19, true, 1),
(20, 'Varekostnad', 'expense', 'detail', 20, false, -1),
(30, 'End. beh. varer u. tilv. og ferdigvarer', 'expense', 'detail', 30, false, -1),
(40, 'Lønnskostnad', 'expense', 'detail', 40, false, -1),
(50, 'Avskrivning', 'expense', 'detail', 50, false, -1),
(60, 'Nedskrivning', 'expense', 'detail', 60, false, -1),
(70, 'Annen driftskostnad', 'expense', 'detail', 70, false, -1),
(79, 'Sum driftskostnader', 'expense', 'subtotal', 79, true, -1),
(80, 'Driftsresultat', 'revenue', 'calculation', 80, true, 1),
(90, 'Inntekt på investering i datterselskap', 'revenue', 'detail', 90, false, 1),
(95, 'Inntekt på investering i annet foretak i samme konsern', 'revenue', 'detail', 95, false, 1),
(100, 'Inntekt på investering i tilknyttet selskap', 'revenue', 'detail', 100, false, 1),
(105, 'Renteinntekt fra foretak i samme konsern', 'revenue', 'detail', 105, false, 1),
(106, 'Renteinntekt fra tilknyttet selskap', 'revenue', 'detail', 106, false, 1),
(110, 'Annen renteinntekt', 'revenue', 'detail', 110, false, 1),
(115, 'Annen finansinntekt', 'revenue', 'detail', 115, false, 1),
(120, 'Verdiøkning markedsbaserte omløpsmidler', 'revenue', 'detail', 120, false, 1),
(125, 'Verdireduksjon markedsbaserte omløpsmidler', 'expense', 'detail', 125, false, -1),
(130, 'Nedskrivning av finansielle eiendeler', 'expense', 'detail', 130, false, -1),
(135, 'Nedskrivning av andre finansielle anleggsmidler', 'expense', 'detail', 135, false, -1),
(140, 'Rentekostnad til foretak i samme konsern', 'expense', 'detail', 140, false, -1),
(141, 'Rentekostnad til tilknyttet selskap', 'expense', 'detail', 141, false, -1),
(145, 'Annen rentekostnad', 'expense', 'detail', 145, false, -1),
(150, 'Annen finanskostnad', 'expense', 'detail', 150, false, -1),
(155, 'Resultat av finansposter', 'revenue', 'subtotal', 155, true, 1),
(160, 'Resultat før skattekostnad', 'revenue', 'calculation', 160, true, 1),
(165, 'Skattekostnad på resultat', 'expense', 'detail', 165, false, -1),
(280, 'Årsresultat', 'revenue', 'calculation', 280, true, 1)
ON CONFLICT (regnskapslinjenummer) DO UPDATE SET
  standard_name = EXCLUDED.standard_name,
  account_type = EXCLUDED.account_type,
  line_type = EXCLUDED.line_type,
  display_order = EXCLUDED.display_order,
  is_total_line = EXCLUDED.is_total_line,
  sign_multiplier = EXCLUDED.sign_multiplier;

-- Set up parent-child relationships
UPDATE public.standard_accounts SET parent_line_id = (SELECT id FROM public.standard_accounts WHERE regnskapslinjenummer = 19) WHERE regnskapslinjenummer IN (10, 15);
UPDATE public.standard_accounts SET parent_line_id = (SELECT id FROM public.standard_accounts WHERE regnskapslinjenummer = 79) WHERE regnskapslinjenummer IN (20, 30, 40, 50, 60, 70);
UPDATE public.standard_accounts SET parent_line_id = (SELECT id FROM public.standard_accounts WHERE regnskapslinjenummer = 155) WHERE regnskapslinjenummer IN (90, 95, 100, 105, 106, 110, 115, 120, 125, 130, 135, 140, 141, 145, 150);

-- Set up calculation formulas
UPDATE public.standard_accounts SET calculation_formula = '19 + 79' WHERE regnskapslinjenummer = 80;
UPDATE public.standard_accounts SET calculation_formula = '80 + 155' WHERE regnskapslinjenummer = 160;
UPDATE public.standard_accounts SET calculation_formula = '160 + 165' WHERE regnskapslinjenummer = 280;