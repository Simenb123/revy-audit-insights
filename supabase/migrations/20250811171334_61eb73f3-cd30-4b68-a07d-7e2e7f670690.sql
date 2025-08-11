
-- 1) Enum-typer for tasks
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status_type') then
    create type public.task_status_type as enum ('todo','in_progress','blocked','on_hold','done');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_priority_type') then
    create type public.task_priority_type as enum ('low','medium','high','urgent');
  end if;
end $$;

-- 2) Tabell: tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  team_id uuid references public.client_teams(id) on delete set null,
  title text not null,
  description text,
  status public.task_status_type not null default 'todo',
  priority public.task_priority_type not null default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  due_date date,
  estimated_hours numeric not null default 0,
  remaining_hours numeric,
  tags text[] not null default '{}',
  checklist jsonb not null default '[]',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indekser for tasks
create index if not exists idx_tasks_client on public.tasks (client_id);
create index if not exists idx_tasks_team on public.tasks (team_id);
create index if not exists idx_tasks_assignee on public.tasks (assignee_id);
create index if not exists idx_tasks_due_date on public.tasks (due_date);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_priority on public.tasks (priority);
create index if not exists idx_tasks_created_by on public.tasks (created_by);

-- RLS for tasks
alter table public.tasks enable row level security;

-- Lesetilgang: avdeling/lag/roller eller egen-tilgang
create policy tasks_view_access
on public.tasks
for select
to authenticated
using (
  -- Egen-tilgang
  assignee_id = auth.uid()
  or created_by = auth.uid()
  -- Teamtilgang
  or (team_id is not null and team_id in (select unnest(get_user_team_ids(auth.uid()))))
  -- Avdelingstilgang
  or (client_id in (select c.id from public.clients c where c.department_id = get_user_department(auth.uid())))
  -- Roller
  or (get_user_role(auth.uid()) in ('admin','partner','manager'))
);

-- Opprette: må være innenfor tilgang og være creator
create policy tasks_insert_access
on public.tasks
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    (team_id is not null and team_id in (select unnest(get_user_team_ids(auth.uid()))))
    or (client_id in (select c.id from public.clients c where c.department_id = get_user_department(auth.uid())))
    or (get_user_role(auth.uid()) in ('admin','partner','manager'))
  )
);

-- Oppdatere: creator, assignee, eller lederroller – og innenfor samme tilgangsrammer
create policy tasks_update_access
on public.tasks
for update
to authenticated
using (
  (created_by = auth.uid() or assignee_id = auth.uid() or get_user_role(auth.uid()) in ('admin','partner','manager'))
  and (
    (team_id is not null and team_id in (select unnest(get_user_team_ids(auth.uid()))))
    or (client_id in (select c.id from public.clients c where c.department_id = get_user_department(auth.uid())))
    or (get_user_role(auth.uid()) in ('admin','partner','manager'))
  )
)
with check (
  (created_by = auth.uid() or assignee_id = auth.uid() or get_user_role(auth.uid()) in ('admin','partner','manager'))
  and (
    (team_id is not null and team_id in (select unnest(get_user_team_ids(auth.uid()))))
    or (client_id in (select c.id from public.clients c where c.department_id = get_user_department(auth.uid())))
    or (get_user_role(auth.uid()) in ('admin','partner','manager'))
  )
);

-- Slette: creator eller lederroller – og innenfor samme tilgang
create policy tasks_delete_access
on public.tasks
for delete
to authenticated
using (
  (created_by = auth.uid() or get_user_role(auth.uid()) in ('admin','partner','manager'))
  and (
    (team_id is not null and team_id in (select unnest(get_user_team_ids(auth.uid()))))
    or (client_id in (select c.id from public.clients c where c.department_id = get_user_department(auth.uid())))
    or (get_user_role(auth.uid()) in ('admin','partner','manager'))
  )
);

-- 3) Tabell: employee_capacity
create table if not exists public.employee_capacity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_year integer not null,
  period_month integer check (period_month between 1 and 12),
  fte_percent numeric not null default 100,
  capacity_hours numeric not null default 0,
  planned_absence_hours numeric not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unik per bruker/år/måned (0 = årlig)
create unique index if not exists uq_employee_capacity_user_period
on public.employee_capacity (user_id, period_year, coalesce(period_month, 0));

create index if not exists idx_employee_capacity_user on public.employee_capacity (user_id);
create index if not exists idx_employee_capacity_period on public.employee_capacity (period_year, period_month);

-- RLS for employee_capacity
alter table public.employee_capacity enable row level security;

-- Egen-innsyn
create policy employee_capacity_view_own
on public.employee_capacity
for select
to authenticated
using (user_id = auth.uid());

-- Leder-innsyn innen samme firma
create policy employee_capacity_view_firm_leaders
on public.employee_capacity
for select
to authenticated
using (
  get_user_role(auth.uid()) in ('admin','partner','manager')
  and exists (
    select 1
    from public.profiles p_target
    where p_target.id = employee_capacity.user_id
      and p_target.audit_firm_id = get_user_firm(auth.uid())
  )
);

-- Egen-endring
create policy employee_capacity_manage_own
on public.employee_capacity
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Leder-endring innen samme firma
create policy employee_capacity_manage_firm_leaders
on public.employee_capacity
for all
to authenticated
using (
  get_user_role(auth.uid()) in ('admin','partner','manager')
  and exists (
    select 1
    from public.profiles p_target
    where p_target.id = employee_capacity.user_id
      and p_target.audit_firm_id = get_user_firm(auth.uid())
  )
)
with check (
  get_user_role(auth.uid()) in ('admin','partner','manager')
  and exists (
    select 1
    from public.profiles p_target
    where p_target.id = employee_capacity.user_id
      and p_target.audit_firm_id = get_user_firm(auth.uid())
  )
);

-- 4) Forberede månedlig granularitet for team_member_allocations
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_member_allocations'
      and column_name = 'period_month'
  ) then
    alter table public.team_member_allocations
      add column period_month integer check (period_month between 1 and 12);
  end if;
end $$;

-- Filterindekser for raskere spørringer
create index if not exists idx_tma_team_year_month
  on public.team_member_allocations (team_id, period_year, period_month);
create index if not exists idx_tma_client_year
  on public.team_member_allocations (client_id, period_year);
