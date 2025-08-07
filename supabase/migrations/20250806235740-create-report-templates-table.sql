CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  widgets jsonb NOT NULL,
  layouts jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
