-- Enforces that a message's optional declaration_id, when present, always
-- belongs to the same user as the message's own recipient_user_id.
--
-- Nothing in the messages table's schema stops staff from accidentally
-- inserting a row where declaration_id points at a declaration owned by a
-- DIFFERENT user than recipient_user_id (e.g. a copy-paste mistake in the
-- Studio SQL editor) — the consequence would be a user getting a
-- message/email about someone else's tax filing. Staff write this table
-- via raw SQL with no application-level validation, so this needs to be
-- enforced in the database itself.
--
-- A trigger is used rather than a CHECK constraint or RLS policy because
-- the rule spans two tables (messages, declarations) and must be enforced
-- regardless of which role performs the write — triggers fire for every
-- writer, including the privileged Studio connection staff use, since RLS
-- (which this table has none of for INSERT) never applies to that
-- connection in the first place.

create or replace function public.check_message_declaration_ownership()
returns trigger
language plpgsql
as $$
begin
  if new.declaration_id is not null then
    if not exists (
      select 1
      from public.declarations d
      where d.id = new.declaration_id
        and d.user_id = new.recipient_user_id
    ) then
      raise exception 'declaration_id % does not belong to recipient_user_id %',
        new.declaration_id, new.recipient_user_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger messages_check_declaration_ownership
  before insert or update on public.messages
  for each row execute function public.check_message_declaration_ownership();
