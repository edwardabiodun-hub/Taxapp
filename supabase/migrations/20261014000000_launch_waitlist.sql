create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  name text,
  source text not null default 'filing-cta',
  notification_consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'notified', 'converted', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint launch_waitlist_email_valid check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint launch_waitlist_source_valid check (char_length(source) between 1 and 80),
  constraint launch_waitlist_name_valid check (name is null or char_length(name) <= 120),
  constraint launch_waitlist_email_unique unique (email_normalized)
);

alter table public.launch_waitlist enable row level security;
revoke all on table public.launch_waitlist from public, anon, authenticated;

create or replace function public.join_launch_waitlist(
  p_email text,
  p_name text default null,
  p_source text default 'filing-cta',
  p_notification_consent boolean default false
)
returns table (status text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_source text := nullif(btrim(coalesce(p_source, '')), '');
  v_rate_key text := 'launch-waitlist:' || coalesce(auth.uid()::text, inet_client_addr()::text, 'unknown');
begin
  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email address';
  end if;
  if not coalesce(p_notification_consent, false) then
    raise exception 'Notification consent is required';
  end if;
  if v_source is null or char_length(v_source) > 80 then
    raise exception 'Invalid waitlist source';
  end if;
  if v_name is not null and char_length(v_name) > 120 then
    raise exception 'Invalid name';
  end if;
  if not public.consume_rate_limit(v_rate_key, 5, 3600) then
    raise exception 'Rate limit exceeded';
  end if;

  insert into public.launch_waitlist (email, name, source, notification_consent)
  values (v_email, v_name, v_source, true)
  on conflict (email_normalized) do nothing;

  return query select case when found then 'joined' else 'already_joined' end;
end;
$$;

revoke all on function public.join_launch_waitlist(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.join_launch_waitlist(text, text, text, boolean) to anon, authenticated;

create index launch_waitlist_status_created_idx on public.launch_waitlist (status, created_at desc);

create trigger launch_waitlist_set_updated_at
  before update on public.launch_waitlist
  for each row execute function public.set_updated_at();
