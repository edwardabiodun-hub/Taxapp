-- Cross-row ownership and field-level write protections.

create or replace function public.check_activity_declaration_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.declarations d
    where d.id = new.declaration_id
      and d.user_id = new.user_id
  ) then
    raise exception
      'declaration_id % does not belong to user_id %',
      new.declaration_id,
      new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists activities_check_declaration_ownership
on public.activities;

create trigger activities_check_declaration_ownership
before insert or update on public.activities
for each row
execute function public.check_activity_declaration_ownership();

create or replace function public.guard_user_declaration_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Privileged staff/service-role writes are controlled outside auth.uid().
  if auth.uid() is null then
    return new;
  end if;

  if new.user_id <> auth.uid() then
    raise exception 'Cannot change declaration ownership';
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'submitted') then
      raise exception 'Invalid initial declaration status';
    end if;
    new.amount := null;
    new.synced_at := null;
    new.created_at := now();
  else
    new.status := old.status;
    new.amount := old.amount;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    new.synced_at := old.synced_at;
  end if;

  return new;
end;
$$;

drop trigger if exists declarations_guard_user_write on public.declarations;

create trigger declarations_guard_user_write
before insert or update on public.declarations
for each row
execute function public.guard_user_declaration_write();

create or replace function public.guard_user_profile_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from auth.uid() then
    raise exception 'Cannot change profile ownership';
  end if;

  if tg_op = 'INSERT' then
    new.pseudonymized_at := null;
    return new;
  end if;

  -- Only the dedicated security-definer function may set this marker.
  if current_setting('filesmart.pseudonymization', true) <> 'true' then
    new.pseudonymized_at := old.pseudonymized_at;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_user_write on public.profiles;

create trigger profiles_guard_user_write
before insert or update on public.profiles
for each row
execute function public.guard_user_profile_write();

create or replace function public.pseudonymize_own_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform set_config('filesmart.pseudonymization', 'true', true);

  update public.profiles
  set name = 'Deleted user',
      phone = '',
      date_of_birth = null,
      country_of_birth = null,
      gender = null,
      nationality = null,
      pseudonymized_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.pseudonymize_own_profile() from public;
grant execute on function public.pseudonymize_own_profile() to authenticated;

create table public.message_email_deliveries (
  message_id uuid primary key references public.messages(id) on delete cascade,
  status text not null check (status in ('sending', 'failed', 'sent')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.message_email_deliveries enable row level security;
revoke all on table public.message_email_deliveries from public, anon, authenticated;
grant all on table public.message_email_deliveries to service_role;

create or replace function public.claim_message_email_delivery(p_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status
  into v_status
  from public.message_email_deliveries
  where message_id = p_message_id
  for update;

  if found then
    if v_status in ('sending', 'sent') then
      return false;
    end if;

    update public.message_email_deliveries
    set status = 'sending',
        attempts = attempts + 1,
        last_error = null,
        updated_at = now()
    where message_id = p_message_id;
    return true;
  end if;

  insert into public.message_email_deliveries(message_id, status, attempts)
  values (p_message_id, 'sending', 1);
  return true;
end;
$$;

create or replace function public.mark_message_email_sent(p_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.message_email_deliveries
  set status = 'sent', sent_at = now(), updated_at = now()
  where message_id = p_message_id;
  return found;
end;
$$;

create or replace function public.mark_message_email_failed(p_message_id uuid, p_error text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.message_email_deliveries
  set status = 'failed', last_error = left(p_error, 1000), updated_at = now()
  where message_id = p_message_id;
  return found;
end;
$$;

revoke all on function public.claim_message_email_delivery(uuid) from public, anon, authenticated;
revoke all on function public.mark_message_email_sent(uuid) from public, anon, authenticated;
revoke all on function public.mark_message_email_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_message_email_delivery(uuid) to service_role;
grant execute on function public.mark_message_email_sent(uuid) to service_role;
grant execute on function public.mark_message_email_failed(uuid, text) to service_role;
