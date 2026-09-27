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
