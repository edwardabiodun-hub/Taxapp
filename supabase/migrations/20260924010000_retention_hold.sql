-- Data retention hold, per the NDPA/NTAA compliance research
-- (research_notes/reports/"NDPA tax data retention Nigeria").
--
-- Two changes:
--
-- 1. The auth.users-referencing foreign keys on profiles/declarations/
--    activities were `on delete cascade`. That meant deleting a user's
--    auth.users row -- the natural implementation of "delete my account" --
--    would silently destroy declaration records still inside their NTAA
--    2025 s.31(5) six-year mandatory retention window. Changed to
--    `on delete restrict`: Postgres now refuses to delete an auth.users row
--    while any profile/declaration/activity still references it, forcing
--    account deletion through explicit, retention-aware application logic
--    (see src/lib/account-deletion.ts) instead of a blind cascade.
--
-- 2. The declarations DELETE policy previously allowed a user to delete
--    any of their own declarations at any time. It now also requires the
--    declaration to be outside its retention hold -- mirrored from
--    src/lib/data-retention.ts's isUnderRetentionHold(): under hold while
--    status = 'audit_request' (NTAA s.36(4): no time limit for suspected
--    misstatement), or while fewer than six full years have elapsed since
--    the assessment year (NTAA s.31(5)). This is the real enforcement
--    boundary -- a bug in application code can no longer delete a record
--    the law requires TaxEase to keep, because the database itself refuses.
--    Activities keep cascading from declarations (an activity has no
--    purpose once its parent declaration is legitimately deleted), and
--    keep their own restricted delete via the RLS policy on declarations
--    combined with the FK cascade.

alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete restrict;

alter table public.declarations
  drop constraint declarations_user_id_fkey,
  add constraint declarations_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete restrict;

alter table public.activities
  drop constraint activities_user_id_fkey,
  add constraint activities_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete restrict;

drop policy "delete own declarations" on public.declarations;

create policy "delete own declarations outside retention hold" on public.declarations
  for delete using (
    auth.uid() = user_id
    and status <> 'audit_request'
    and now() >= make_date((tax_year::int + 7), 1, 1)
  );

-- Profiles gain a pseudonymization marker: a deletion request pseudonymizes
-- immediately (satisfies the user's intent right away) even when the
-- profile can't be fully removed yet because a linked declaration is still
-- under hold -- the row can only be hard-deleted once every declaration
-- referencing it has cleared its own retention window.
alter table public.profiles
  add column pseudonymized_at timestamptz;

comment on column public.profiles.pseudonymized_at is
  'Set when the user requested deletion but at least one linked declaration was still under its NTAA retention hold, so the profile was pseudonymized (name/phone nulled) rather than removed. Row stays until every linked declaration has cleared its hold.';
