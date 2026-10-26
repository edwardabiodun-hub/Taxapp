-- Privacy-minimized abandoned-preparation reminder state.
-- This table intentionally excludes tax amounts, form data, documents, and
-- receipt contents. It exists only to evaluate reminder eligibility.

create table public.preparation_reminder_states (
  preparation_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year text not null,
  jurisdiction_code text not null,
  status text not null check (status in ('draft', 'ready_for_review', 'exported', 'user_submitted', 'authority_confirmed', 'deleted')),
  last_meaningful_activity_at timestamptz not null,
  last_resumed_at timestamptz,
  submitted_at timestamptz,
  deleted_at timestamptz,
  reminder_count integer not null default 0 check (reminder_count >= 0 and reminder_count <= 2),
  last_reminded_at timestamptz,
  reminder_dismissed_at timestamptz,
  snoozed_until timestamptz,
  deadline_due_at timestamptz,
  deadline_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index preparation_reminder_due_idx
  on public.preparation_reminder_states (last_meaningful_activity_at, status, reminder_count);
create index preparation_reminder_user_idx
  on public.preparation_reminder_states (user_id);

alter table public.preparation_reminder_states enable row level security;

create policy "users can view their own reminder state"
  on public.preparation_reminder_states for select
  using (auth.uid() = user_id);

create policy "users can create their own reminder state"
  on public.preparation_reminder_states for insert
  with check (auth.uid() = user_id);

create policy "users can update their own reminder state"
  on public.preparation_reminder_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own reminder state"
  on public.preparation_reminder_states for delete
  using (auth.uid() = user_id);

create or replace function public.sync_my_preparation_reminder_state(
  p_preparation_id text,
  p_tax_year text,
  p_jurisdiction_code text,
  p_status text,
  p_last_meaningful_activity_at timestamptz,
  p_submitted_at timestamptz,
  p_deadline_due_at timestamptz,
  p_deadline_source text,
  p_created_at timestamptz,
  p_updated_at timestamptz
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.preparation_reminder_states (
    preparation_id, user_id, tax_year, jurisdiction_code, status,
    last_meaningful_activity_at, submitted_at, deadline_due_at,
    deadline_source, created_at, updated_at
  ) values (
    p_preparation_id, auth.uid(), p_tax_year, p_jurisdiction_code, p_status,
    p_last_meaningful_activity_at, p_submitted_at, p_deadline_due_at,
    p_deadline_source, p_created_at, p_updated_at
  )
  on conflict (preparation_id) do update set
    tax_year = excluded.tax_year,
    jurisdiction_code = excluded.jurisdiction_code,
    status = excluded.status,
    last_meaningful_activity_at = excluded.last_meaningful_activity_at,
    submitted_at = excluded.submitted_at,
    deadline_due_at = excluded.deadline_due_at,
    deadline_source = excluded.deadline_source,
    updated_at = excluded.updated_at
  where preparation_reminder_states.user_id = auth.uid();
end;
$$;

revoke all on function public.sync_my_preparation_reminder_state(text, text, text, text, timestamptz, timestamptz, timestamptz, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.sync_my_preparation_reminder_state(text, text, text, text, timestamptz, timestamptz, timestamptz, text, timestamptz, timestamptz) to authenticated;

create or replace function public.dismiss_my_preparation_reminders(p_preparation_id text)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.preparation_reminder_states
  set reminder_dismissed_at = now(), updated_at = now()
  where preparation_id = p_preparation_id and user_id = auth.uid();
$$;

revoke all on function public.dismiss_my_preparation_reminders(text) from public, anon;
grant execute on function public.dismiss_my_preparation_reminders(text) to authenticated;

create table public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_reminders_enabled boolean not null default true,
  email_reminders_enabled boolean not null default false,
  reminder_consent_at timestamptz,
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_preferences enable row level security;

create policy "users can view their own notification preferences"
  on public.user_notification_preferences for select
  using (auth.uid() = user_id);

create policy "users can create their own notification preferences"
  on public.user_notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "users can update their own notification preferences"
  on public.user_notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.preparation_reminder_states replica identity full;
alter table public.user_notification_preferences replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'preparation_reminder_states'
  ) then
    alter publication supabase_realtime add table public.preparation_reminder_states;
  end if;
end
$$;

-- Reminder messages are generic and contain no sensitive tax payload.
alter table public.messages drop constraint if exists messages_category_check;
alter table public.messages add constraint messages_category_check
  check (category in ('refund_status', 'document_request', 'return_reminder', 'general'));

alter table public.messages add column if not exists action_url text;
alter table public.messages add column if not exists reminder_key text;
create unique index if not exists messages_reminder_key_unique
  on public.messages (reminder_key)
  where reminder_key is not null;
