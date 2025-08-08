-- Fix existing formula_variables structure if table already existed without formula_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='formula_variables'
  ) THEN
    -- Add formula_id column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='formula_variables' AND column_name='formula_id'
    ) THEN
      ALTER TABLE public.formula_variables ADD COLUMN formula_id UUID;
    END IF;

    -- Add created_by column if missing (used by RLS)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='formula_variables' AND column_name='created_by'
    ) THEN
      ALTER TABLE public.formula_variables ADD COLUMN created_by UUID;
    END IF;

    -- Add timestamps if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='formula_variables' AND column_name='created_at'
    ) THEN
      ALTER TABLE public.formula_variables ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='formula_variables' AND column_name='updated_at'
    ) THEN
      ALTER TABLE public.formula_variables ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- Add FK if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname='formula_variables_formula_id_fkey'
    ) THEN
      ALTER TABLE public.formula_variables
      ADD CONSTRAINT formula_variables_formula_id_fkey
      FOREIGN KEY (formula_id) REFERENCES public.formula_definitions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END$$;

-- Recreate index (safe if column now exists)
CREATE INDEX IF NOT EXISTS idx_formula_variables_formula_id ON public.formula_variables(formula_id);
