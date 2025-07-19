-- Create missing tags table that the edge function expects
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#10B981',
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tags
DROP POLICY IF EXISTS "Tags are public" ON public.tags;
CREATE POLICY "Tags are public"
  ON public.tags
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage tags
DROP POLICY IF EXISTS "Authenticated users can manage tags" ON public.tags;
CREATE POLICY "Authenticated users can manage tags"
  ON public.tags
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert some basic tags for knowledge articles
INSERT INTO public.tags (name, display_name, description, color, category) VALUES
('isa-315', 'ISA 315', 'Identifisering og vurdering av risiko', '#3B82F6', 'standard'),
('revisjon', 'Revisjon', 'Generelle revisjonstemaer', '#10B981', 'generelt'),
('risikovurdering', 'Risikovurdering', 'Risikovurdering og planlegging', '#F59E0B', 'prosess'),
('dokumentasjon', 'Dokumentasjon', 'Dokumentasjonskrav og beste praksis', '#8B5CF6', 'prosess'),
('kontroller', 'Kontroller', 'Interne kontroller og testing', '#EF4444', 'prosess'),
('finanstilsyn', 'Finanstilsyn', 'Tilsynsfunn og veiledning', '#6B7280', 'tilsyn'),
('årsavslutning', 'Årsavslutning', 'Årsavslutning og regnskapsavleggelse', '#059669', 'prosess')
ON CONFLICT (name) DO NOTHING;