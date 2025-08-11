
-- 1) Utvid profiles med initialer og farge
alter table public.profiles
  add column if not exists initials text,
  add column if not exists initials_color text default '#64748b';

-- 2) RLS for profiles: gi firmens admin/partner/manager rettigheter til å se/oppdatere
-- NB: eksisterende "egen profil"-policy beholdes; disse er tilleggspolicyer

-- Se profiler i samme firma for admin/partner/manager
create policy if not exists "Firm admins can view firm profiles"
on public.profiles
for select
using (
  (audit_firm_id = get_user_firm(auth.uid())) 
  and (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
);

-- Oppdatere profiler i samme firma for admin/partner/manager
create policy if not exists "Firm admins can update firm profiles"
on public.profiles
for update
using (
  (audit_firm_id = get_user_firm(auth.uid()))
  and (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
)
with check (
  (audit_firm_id = get_user_firm(auth.uid()))
  and (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
);

-- 3) Tabell for allokering av budsjett-timer per ansatt, per team og år
create table if not exists public.team_member_allocations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  team_id uuid not null references public.client_teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_year integer not null default date_part('year', now())::int,
  budget_hours numeric not null default 0,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, team_id, user_id, period_year)
);

-- Trigger for updated_at
create trigger if not exists set_updated_at_team_member_allocations
before update on public.team_member_allocations
for each row execute procedure public.update_updated_at_column();

-- Slå på RLS
alter table public.team_member_allocations enable row level security;

-- SELECT-policy: teammedlemmer, samme avdeling, eller admin/partner/manager
create policy if not exists "Allocations view permissions"
on public.team_member_allocations
for select
using (
  -- Brukere i teamet kan lese
  (team_id in (select get_user_team_ids(auth.uid())))
  or
  -- Brukere i samme avdeling (via klientens department_id) kan lese
  (client_id in (
      select c.id from public.clients c
      where c.department_id = get_user_department(auth.uid())
  ))
  or
  -- Admin/partner/manager kan lese
  (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
);

-- INSERT/UPDATE/DELETE-policy: avdelingsvise admin/partner/manager kan endre
create policy if not exists "Allocations manage permissions"
on public.team_member_allocations
for all
using (
  (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
  and
  (client_id in (
      select c.id from public.clients c
      where c.department_id = get_user_department(auth.uid())
  ))
)
with check (
  (get_user_role(auth.uid()) = any (array['admin','partner','manager']::user_role_type[]))
  and
  (client_id in (
      select c.id from public.clients c
      where c.department_id = get_user_department(auth.uid())
  ))
);

-- Indexer for ytelse
create index if not exists idx_tma_team_year on public.team_member_allocations(team_id, period_year);
create index if not exists idx_tma_user_year on public.team_member_allocations(user_id, period_year);
create index if not exists idx_tma_client on public.team_member_allocations(client_id);
