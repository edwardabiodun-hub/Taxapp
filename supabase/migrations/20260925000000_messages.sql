-- Admin-to-user messages, with an outbound email notification triggered by
-- a Supabase Database Webhook on INSERT (configured manually after this
-- migration is applied — see Task 8's setup instructions; it is not part
-- of this SQL file since it needs the deployed Edge Function's own URL).
--
-- Unlike every other table in this schema, a message is written by a
-- second party (staff) to a row a different user reads. Staff insert rows
-- directly via the Supabase Studio SQL editor — the same privileged
-- connection already used to change declarations.status by hand — which
-- bypasses RLS entirely. This table intentionally has no INSERT or DELETE
-- policy for the `authenticated` role at all.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  declaration_id uuid references public.declarations(id) on delete set null,
  category text not null default 'general'
    check (category in ('refund_status', 'document_request', 'general')),
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "select own messages" on public.messages
  for select using (auth.uid() = recipient_user_id);

-- Recipients may mark a message read, but must not be able to rewrite its
-- subject/body/category. RLS policies scope which ROWS are touched, not
-- which columns — restricting to read_at needs a column-level grant. This
-- revokes the broad UPDATE the authenticated role has by default on every
-- public table (Supabase's project-wide default privileges), then grants
-- it back for read_at only. The policy below still scopes which rows.
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "update own message read status" on public.messages
  for update using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

create index messages_recipient_user_id_idx on public.messages (recipient_user_id);
create index messages_declaration_id_idx on public.messages (declaration_id);
