-- Retry migration with compatible policy creation
-- 1) Create table for per-user Report Builder settings
create table if not exists public.report_builder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_key text not null,
  fiscal_year integer not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_builder_settings_unique unique (user_id, client_key, fiscal_year)
);

-- Enable RLS
alter table public.report_builder_settings enable row level security;

-- Ensure clean policy names
drop policy if exists "owner_can_manage_settings" on public.report_builder_settings;
drop policy if exists "owner_can_read_settings" on public.report_builder_settings;

-- RLS policies: owner can manage, only owner can read/write
create policy "owner_can_manage_settings"
  on public.report_builder_settings
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Explicit read policy (clarity)
create policy "owner_can_read_settings"
  on public.report_builder_settings
  for select
  using (user_id = auth.uid());

-- Trigger to maintain updated_at
create or replace function public.set_updated_at_report_builder_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_report_builder_settings on public.report_builder_settings;
create trigger set_updated_at_report_builder_settings
before update on public.report_builder_settings
for each row execute function public.set_updated_at_report_builder_settings();