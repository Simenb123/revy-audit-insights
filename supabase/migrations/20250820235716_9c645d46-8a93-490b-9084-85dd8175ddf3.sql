-- Add missing fields to training_scenarios table
ALTER TABLE public.training_scenarios ADD COLUMN IF NOT EXISTS risk_objectives TEXT[] DEFAULT '{}';

-- Add missing fields to training_actions table  
ALTER TABLE public.training_actions ADD COLUMN IF NOT EXISTS reveal_key TEXT;

-- Update existing Nordic Varehandel scenario with proper risk objectives
UPDATE public.training_scenarios 
SET 
  risk_objectives = ARRAY['periodisering','ulovlig_laan','varelager_nedskrivning','tapsrisiko_fordringer'],
  target_actions = 15,
  initial_budget = 10000, -- NOK instead of dollars
  description = 'Nordic Varehandel AS er et mellomstort handelsforetak som importerer og selger elektroniske forbrukerprodukter. Selskapet har 25 ansatte og omsetter for ca. 180 millioner kroner årlig. Du er ansatt som revisor og skal gjennomføre revisjonen av årsregnskapet for 2023.'
WHERE title = 'Nordic Varehandel AS';

-- Update training actions with reveal_key mappings and improve content
UPDATE public.training_actions 
SET reveal_key = 'ulovlig_laan',
    reveal_text = 'CFO opplyser at selskapet ga et kortsiktig lån til daglig leder på 1,5 millioner kroner i desember. Lånet ble ikke rapportert til revisor eller styre, og det foreligger ingen dokumentasjon på vilkår eller sikkerhet. Dette utgjør en betydelig nærstående-transaksjon som må undersøkes nærmere.'
WHERE title = 'Spør CFO om uvanlige transaksjoner' AND step_number = 1;

UPDATE public.training_actions 
SET reveal_key = 'periodisering',
    reveal_text = 'Regnskapsføreren bekrefter at selskapet har periodisert inntekter på 2,3 millioner kroner i desember som egentlig tilhører januar 2024. Dette ble gjort for å "forbedre tallene" før årsavslutning. Periodigeringen er ikke i henhold til god regnskapsskikk.'
WHERE title = 'Gjennomgå periodiseringsposteringer' AND step_number = 1;

UPDATE public.training_actions 
SET reveal_key = 'varelager_nedskrivning',
    reveal_text = 'Lagertellingen avdekker varer til bokført verdi 3,8 millioner kroner som ikke kan selges grunnet teknisk foreldelse. Ledelsen har ikke foretatt nedskrivning, noe som overvurderer varelageret betydelig.'
WHERE title = 'Fysisk lagertelling og verdsettelse' AND step_number = 2;

UPDATE public.training_actions 
SET reveal_key = 'tapsrisiko_fordringer',
    reveal_text = 'Aldersanalysen viser at 4,2 millioner kroner av kundefordringene er over 90 dager gamle. Tre store kunder har betalingsproblemer, men selskapet har ikke avsatt tilstrekkelige tapsavsetninger. Dette utgjør en vesentlig risiko for overvurdering av fordringene.'
WHERE title = 'Analysere aldersfordeling kundefordringer' AND step_number = 2;