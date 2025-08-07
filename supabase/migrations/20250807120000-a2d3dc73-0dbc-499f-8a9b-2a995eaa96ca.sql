-- Create widget_templates table
create table if not exists widget_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  description text,
  default_config jsonb not null,
  created_at timestamptz default now()
);

alter table widget_templates enable row level security;
create policy "Allow read for authenticated" on widget_templates for select using (auth.role() = 'authenticated');
