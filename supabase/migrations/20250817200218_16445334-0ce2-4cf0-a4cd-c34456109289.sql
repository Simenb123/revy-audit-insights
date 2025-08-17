-- Phase 3: Asset Management and Depreciation
-- This migration adds support for fixed assets, depreciation schedules, and asset tracking

-- Asset categories table
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')),
  default_useful_life_years INTEGER,
  default_salvage_value_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

-- Asset categories policies
CREATE POLICY "Asset categories are viewable by all authenticated users"
ON public.asset_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage asset categories"
ON public.asset_categories FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Fixed assets table
CREATE TABLE public.fixed_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  asset_category_id UUID REFERENCES public.asset_categories(id),
  asset_number TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC(15,2) NOT NULL,
  salvage_value NUMERIC(15,2) DEFAULT 0,
  useful_life_years INTEGER NOT NULL,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')),
  location TEXT,
  serial_number TEXT,
  vendor TEXT,
  warranty_expiry_date DATE,
  disposal_date DATE,
  disposal_price NUMERIC(15,2),
  disposal_method TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'impaired', 'under_construction')),
  book_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_asset_number_per_client UNIQUE (client_id, asset_number)
);

-- Enable RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

-- Fixed assets policies
CREATE POLICY "Users can manage fixed assets for their clients"
ON public.fixed_assets FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR 
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Depreciation schedules table
CREATE TABLE public.depreciation_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixed_asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  depreciation_amount NUMERIC(15,2) NOT NULL,
  accumulated_depreciation NUMERIC(15,2) NOT NULL,
  book_value NUMERIC(15,2) NOT NULL,
  is_calculated BOOLEAN NOT NULL DEFAULT true,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  journal_entry_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_asset_period UNIQUE (fixed_asset_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.depreciation_schedules ENABLE ROW LEVEL SECURITY;

-- Depreciation schedules policies
CREATE POLICY "Users can manage depreciation schedules for their clients' assets"
ON public.depreciation_schedules FOR ALL
TO authenticated
USING (
  fixed_asset_id IN (
    SELECT fa.id FROM fixed_assets fa
    JOIN clients c ON fa.client_id = c.id
    WHERE c.department_id = get_user_department(auth.uid()) OR
          fa.client_id IN (
            SELECT ct.client_id FROM client_teams ct 
            WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
          ) OR
          get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  )
);

-- Asset maintenance log table
CREATE TABLE public.asset_maintenance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixed_asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'upgrade', 'inspection')),
  description TEXT NOT NULL,
  cost NUMERIC(15,2) DEFAULT 0,
  vendor TEXT,
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.asset_maintenance_log ENABLE ROW LEVEL SECURITY;

-- Asset maintenance log policies
CREATE POLICY "Users can manage maintenance logs for their clients' assets"
ON public.asset_maintenance_log FOR ALL
TO authenticated
USING (
  fixed_asset_id IN (
    SELECT fa.id FROM fixed_assets fa
    JOIN clients c ON fa.client_id = c.id
    WHERE c.department_id = get_user_department(auth.uid()) OR
          fa.client_id IN (
            SELECT ct.client_id FROM client_teams ct 
            WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
          ) OR
          get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  )
);

-- Function to calculate straight line depreciation
CREATE OR REPLACE FUNCTION public.calculate_straight_line_depreciation(
  p_purchase_price NUMERIC,
  p_salvage_value NUMERIC,
  p_useful_life_years INTEGER
) RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_useful_life_years <= 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (p_purchase_price - p_salvage_value) / p_useful_life_years / 12;
END;
$$;

-- Function to generate depreciation schedule for an asset
CREATE OR REPLACE FUNCTION public.generate_depreciation_schedule(p_asset_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  asset_record RECORD;
  monthly_depreciation NUMERIC;
  current_date DATE;
  end_date DATE;
  current_year INTEGER;
  current_month INTEGER;
  total_depreciation NUMERIC := 0;
  remaining_value NUMERIC;
  schedule_count INTEGER := 0;
BEGIN
  -- Get asset details
  SELECT * INTO asset_record
  FROM public.fixed_assets
  WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;
  
  -- Clear existing schedule
  DELETE FROM public.depreciation_schedules WHERE fixed_asset_id = p_asset_id;
  
  -- Calculate monthly depreciation (currently only straight line)
  monthly_depreciation := public.calculate_straight_line_depreciation(
    asset_record.purchase_price,
    asset_record.salvage_value,
    asset_record.useful_life_years
  );
  
  -- Set dates
  current_date := asset_record.purchase_date;
  end_date := asset_record.purchase_date + INTERVAL '1 year' * asset_record.useful_life_years;
  remaining_value := asset_record.purchase_price;
  
  -- Generate monthly schedule
  WHILE current_date < end_date LOOP
    current_year := EXTRACT(YEAR FROM current_date);
    current_month := EXTRACT(MONTH FROM current_date);
    
    total_depreciation := total_depreciation + monthly_depreciation;
    remaining_value := asset_record.purchase_price - total_depreciation;
    
    -- Ensure we don't depreciate below salvage value
    IF remaining_value < asset_record.salvage_value THEN
      monthly_depreciation := monthly_depreciation - (asset_record.salvage_value - remaining_value);
      total_depreciation := asset_record.purchase_price - asset_record.salvage_value;
      remaining_value := asset_record.salvage_value;
    END IF;
    
    INSERT INTO public.depreciation_schedules (
      fixed_asset_id,
      period_year,
      period_month,
      depreciation_amount,
      accumulated_depreciation,
      book_value
    ) VALUES (
      p_asset_id,
      current_year,
      current_month,
      monthly_depreciation,
      total_depreciation,
      remaining_value
    );
    
    schedule_count := schedule_count + 1;
    current_date := current_date + INTERVAL '1 month';
    
    -- Stop if we've reached salvage value
    IF remaining_value <= asset_record.salvage_value THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN schedule_count;
END;
$$;

-- Function to get asset summary for a client
CREATE OR REPLACE FUNCTION public.get_asset_summary(p_client_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_assets', COUNT(*),
    'total_cost', SUM(purchase_price),
    'total_book_value', SUM(book_value),
    'total_accumulated_depreciation', SUM(accumulated_depreciation),
    'active_assets', COUNT(*) FILTER (WHERE status = 'active'),
    'disposed_assets', COUNT(*) FILTER (WHERE status = 'disposed'),
    'assets_by_category', json_agg(
      json_build_object(
        'category', COALESCE(ac.name, 'Uncategorized'),
        'count', category_counts.asset_count,
        'total_value', category_counts.total_value
      )
    )
  ) INTO result
  FROM (
    SELECT 
      asset_category_id,
      COUNT(*) as asset_count,
      SUM(book_value) as total_value
    FROM public.fixed_assets
    WHERE client_id = p_client_id
    GROUP BY asset_category_id
  ) category_counts
  LEFT JOIN public.asset_categories ac ON category_counts.asset_category_id = ac.id;
  
  RETURN result;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_fixed_assets_client_id ON public.fixed_assets(client_id);
CREATE INDEX idx_fixed_assets_status ON public.fixed_assets(status);
CREATE INDEX idx_depreciation_schedules_asset_id ON public.depreciation_schedules(fixed_asset_id);
CREATE INDEX idx_depreciation_schedules_period ON public.depreciation_schedules(period_year, period_month);
CREATE INDEX idx_asset_maintenance_log_asset_id ON public.asset_maintenance_log(fixed_asset_id);

-- Trigger to update updated_at columns
CREATE TRIGGER update_asset_categories_updated_at
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fixed_assets_updated_at
  BEFORE UPDATE ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default asset categories
INSERT INTO public.asset_categories (name, description, depreciation_method, default_useful_life_years) VALUES
('Bygg og anlegg', 'Bygninger og faste installasjoner', 'straight_line', 20),
('Maskiner og utstyr', 'Produksjonsmaskiner og industrielt utstyr', 'straight_line', 10),
('Transportmidler', 'Biler, lastebiler og andre kjøretøy', 'straight_line', 5),
('IT-utstyr', 'Datamaskiner, servere og teknisk utstyr', 'straight_line', 3),
('Kontormøbler', 'Møbler og kontorinnredning', 'straight_line', 10),
('Verktøy', 'Håndverktøy og mindre utstyr', 'straight_line', 5);