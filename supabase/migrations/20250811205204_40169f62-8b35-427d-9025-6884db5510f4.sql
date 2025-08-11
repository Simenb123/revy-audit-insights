
-- 1) Ansattspesifikke satser per periode (i NOK)
create table if not exists public.employee_billing_rates (
  id uuid primary key default gen_random_uuid(),
  audit_firm_id uuid not null references public.audit_firms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hourly_rate numeric(10,2) not null,
  valid_from date not null,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_billing_rates_user on public.employee_billing_rates(user_id);
create index if not exists idx_employee_billing_rates_firm_user on public.employee_billing_rates(audit_firm_id, user_id);
create index if not exists idx_employee_billing_rates_range on public.employee_billing_rates(audit_firm_id, valid_from);

alter table public.employee_billing_rates enable row level security;

-- RLS: alle i firmaet kan lese; kun admin/partner/manager kan endre
create policy if not exists "employee_rates_select_firm"
  on public.employee_billing_rates
  for select
  using (audit_firm_id = public.get_user_firm(auth.uid()));

create policy if not exists "employee_rates_insert_admins"
  on public.employee_billing_rates
  for insert
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and user_id in (select p.id from public.profiles p where p.audit_firm_id = public.get_user_firm(auth.uid()))
  );

create policy if not exists "employee_rates_update_admins"
  on public.employee_billing_rates
  for update
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  )
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and user_id in (select p.id from public.profiles p where p.audit_firm_id = public.get_user_firm(auth.uid()))
  );

create policy if not exists "employee_rates_delete_admins"
  on public.employee_billing_rates
  for delete
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  );

-- Oppdater updated_at automatisk
create trigger set_updated_at_employee_billing_rates
  before update on public.employee_billing_rates
  for each row execute procedure public.update_updated_at_column();

-- Valider at perioder ikke overlapper per ansatt i samme firma
create or replace function public.validate_employee_rate_no_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.employee_billing_rates r
    where r.user_id = new.user_id
      and r.audit_firm_id = new.audit_firm_id
      and (new.valid_to is null or r.valid_from <= new.valid_to)
      and (r.valid_to is null or r.valid_to >= new.valid_from)
      and (tg_op = 'INSERT' or r.id <> new.id)
  ) then
    raise exception 'Overlapping employee billing rate period for user % in firm %', new.user_id, new.audit_firm_id;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_employee_rate_no_overlap on public.employee_billing_rates;
create trigger validate_employee_rate_no_overlap
  before insert or update on public.employee_billing_rates
  for each row execute procedure public.validate_employee_rate_no_overlap();


-- 2) Standardsatser per rolle i firmaet (default) per periode
create table if not exists public.firm_role_billing_rates (
  id uuid primary key default gen_random_uuid(),
  audit_firm_id uuid not null references public.audit_firms(id) on delete cascade,
  role public.user_role_type not null,
  hourly_rate numeric(10,2) not null,
  valid_from date not null,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_firm_role_billing_rates_role on public.firm_role_billing_rates(audit_firm_id, role, valid_from);

alter table public.firm_role_billing_rates enable row level security;

create policy if not exists "firm_role_rates_select_firm"
  on public.firm_role_billing_rates
  for select
  using (audit_firm_id = public.get_user_firm(auth.uid()));

create policy if not exists "firm_role_rates_insert_admins"
  on public.firm_role_billing_rates
  for insert
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  );

create policy if not exists "firm_role_rates_update_admins"
  on public.firm_role_billing_rates
  for update
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  )
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  );

create policy if not exists "firm_role_rates_delete_admins"
  on public.firm_role_billing_rates
  for delete
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
  );

create trigger set_updated_at_firm_role_billing_rates
  before update on public.firm_role_billing_rates
  for each row execute procedure public.update_updated_at_column();

create or replace function public.validate_firm_role_rate_no_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.firm_role_billing_rates r
    where r.audit_firm_id = new.audit_firm_id
      and r.role = new.role
      and (new.valid_to is null or r.valid_from <= new.valid_to)
      and (r.valid_to is null or r.valid_to >= new.valid_from)
      and (tg_op = 'INSERT' or r.id <> new.id)
  ) then
    raise exception 'Overlapping firm role billing rate period for role % in firm %', new.role, new.audit_firm_id;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_firm_role_rate_no_overlap on public.firm_role_billing_rates;
create trigger validate_firm_role_rate_no_overlap
  before insert or update on public.firm_role_billing_rates
  for each row execute procedure public.validate_firm_role_rate_no_overlap();


-- 3) Klientspesifikke overstyringer per rolle per periode
create table if not exists public.client_role_billing_rates (
  id uuid primary key default gen_random_uuid(),
  audit_firm_id uuid not null references public.audit_firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role public.user_role_type not null,
  hourly_rate numeric(10,2) not null,
  valid_from date not null,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_role_billing_rates_client on public.client_role_billing_rates(client_id, role, valid_from);
create index if not exists idx_client_role_billing_rates_firm on public.client_role_billing_rates(audit_firm_id, client_id);

alter table public.client_role_billing_rates enable row level security;

create policy if not exists "client_role_rates_select_firm"
  on public.client_role_billing_rates
  for select
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and exists (
      select 1
      from public.clients c
      join public.departments d on c.department_id = d.id
      where c.id = client_id and d.audit_firm_id = public.get_user_firm(auth.uid())
    )
  );

create policy if not exists "client_role_rates_insert_admins"
  on public.client_role_billing_rates
  for insert
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and exists (
      select 1
      from public.clients c
      join public.departments d on c.department_id = d.id
      where c.id = client_id and d.audit_firm_id = public.get_user_firm(auth.uid())
    )
  );

create policy if not exists "client_role_rates_update_admins"
  on public.client_role_billing_rates
  for update
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and exists (
      select 1
      from public.clients c
      join public.departments d on c.department_id = d.id
      where c.id = client_id and d.audit_firm_id = public.get_user_firm(auth.uid())
    )
  )
  with check (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and exists (
      select 1
      from public.clients c
      join public.departments d on c.department_id = d.id
      where c.id = client_id and d.audit_firm_id = public.get_user_firm(auth.uid())
    )
  );

create policy if not exists "client_role_rates_delete_admins"
  on public.client_role_billing_rates
  for delete
  using (
    audit_firm_id = public.get_user_firm(auth.uid())
    and public.get_user_role(auth.uid()) = any (array['admin','partner','manager']::public.user_role_type[])
    and exists (
      select 1
      from public.clients c
      join public.departments d on c.department_id = d.id
      where c.id = client_id and d.audit_firm_id = public.get_user_firm(auth.uid())
    )
  );

create trigger set_updated_at_client_role_billing_rates
  before update on public.client_role_billing_rates
  for each row execute procedure public.update_updated_at_column();

create or replace function public.validate_client_role_rate_no_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.client_role_billing_rates r
    where r.audit_firm_id = new.audit_firm_id
      and r.client_id = new.client_id
      and r.role = new.role
      and (new.valid_to is null or r.valid_from <= new.valid_to)
      and (r.valid_to is null or r.valid_to >= new.valid_from)
      and (tg_op = 'INSERT' or r.id <> new.id)
  ) then
    raise exception 'Overlapping client role billing rate period for client % / role % in firm %', new.client_id, new.role, new.audit_firm_id;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_client_role_rate_no_overlap on public.client_role_billing_rates;
create trigger validate_client_role_rate_no_overlap
  before insert or update on public.client_role_billing_rates
  for each row execute procedure public.validate_client_role_rate_no_overlap();


-- 4) Funksjon for å slå opp effektiv timesats for en ansatt på en gitt dato, valgfritt for en klient
create or replace function public.get_effective_billing_rate(p_user_id uuid, p_date date, p_client_id uuid default null)
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_firm_id uuid;
  v_role public.user_role_type;
  v_rate numeric;
begin
  -- Begrens til innlogget brukers firma
  v_firm_id := public.get_user_firm(auth.uid());

  -- Sikre at brukeren tilhører samme firma
  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.audit_firm_id = v_firm_id
  ) then
    return null;
  end if;

  select user_role into v_role from public.profiles where id = p_user_id;

  -- 1) Klientspesifikk overstyring per rolle
  if p_client_id is not null then
    select cr.hourly_rate into v_rate
    from public.client_role_billing_rates cr
    where cr.audit_firm_id = v_firm_id
      and cr.client_id = p_client_id
      and cr.role = v_role
      and cr.valid_from <= p_date
      and (cr.valid_to is null or cr.valid_to >= p_date)
    order by cr.valid_from desc
    limit 1;

    if v_rate is not null then
      return v_rate;
    end if;
  end if;

  -- 2) Ansattspesifikk sats
  select er.hourly_rate into v_rate
  from public.employee_billing_rates er
  where er.audit_firm_id = v_firm_id
    and er.user_id = p_user_id
    and er.valid_from <= p_date
    and (er.valid_to is null or er.valid_to >= p_date)
  order by er.valid_from desc
  limit 1;

  if v_rate is not null then
    return v_rate;
  end if;

  -- 3) Firmastandard for rollen
  select fr.hourly_rate into v_rate
  from public.firm_role_billing_rates fr
  where fr.audit_firm_id = v_firm_id
    and fr.role = v_role
    and fr.valid_from <= p_date
    and (fr.valid_to is null or fr.valid_to >= p_date)
  order by fr.valid_from desc
  limit 1;

  return v_rate; -- kan være null hvis ingenting er satt
end;
$$;
