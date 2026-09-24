-- TaxEase initial backend schema.
--
-- Identity is Supabase Auth's own auth.users table — no separate app-level
-- credentials table. Every other table is scoped to auth.uid() via RLS, so
-- a user can only ever see or modify their own rows; there is no path in
-- this schema for one user's data to be readable by another.
--
-- Document file bytes are NOT part of this schema. They stay local-only,
-- encrypted at rest on-device (see document-storage.ts) — this schema only
-- carries declaration/profile/activity data. Syncing document content to
-- Supabase Storage is a separate, not-yet-made decision.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  tax_id text not null,
  country text not null,
  date_of_birth date,
  country_of_birth text,
  gender text,
  nationality text,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "select own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year text not null,
  country text not null,
  type text not null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'processing', 'audit_request', 'approved')),
  form_data jsonb not null default '{}'::jsonb,
  -- Document metadata only ({id, name, size, type}[]) — the `id` references
  -- a local-only documentFiles record, not anything in this database.
  documents jsonb not null default '[]'::jsonb,
  amount text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

alter table public.declarations enable row level security;

create policy "select own declarations" on public.declarations
  for select using (auth.uid() = user_id);
create policy "insert own declarations" on public.declarations
  for insert with check (auth.uid() = user_id);
create policy "update own declarations" on public.declarations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own declarations" on public.declarations
  for delete using (auth.uid() = user_id);

create index declarations_user_id_idx on public.declarations (user_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references public.declarations(id) on delete cascade,
  -- Denormalized from declarations.user_id: RLS needs a direct column to
  -- check auth.uid() against without a join on every row.
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('status_change', 'document_upload', 'created', 'note')),
  title text not null,
  description text,
  meta jsonb,
  "timestamp" timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "select own activities" on public.activities
  for select using (auth.uid() = user_id);
create policy "insert own activities" on public.activities
  for insert with check (auth.uid() = user_id);

create index activities_declaration_id_idx on public.activities (declaration_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger declarations_set_updated_at
  before update on public.declarations
  for each row execute function public.set_updated_at();
