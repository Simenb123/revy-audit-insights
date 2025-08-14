-- Harden only the function we added in this migration
create or replace function public.set_updated_at_report_builder_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;