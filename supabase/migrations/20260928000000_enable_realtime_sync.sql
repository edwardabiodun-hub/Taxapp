-- Enable the client sync channel for every user-scoped table. The checks make
-- this migration safe to replay in environments where one or more tables
-- were already added to the publication manually.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'declarations', 'activities', 'messages'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;

-- DELETE payloads must include the ownership column so the client can reject
-- a malformed or cross-user event before touching IndexedDB.
alter table public.profiles replica identity full;
alter table public.declarations replica identity full;
alter table public.activities replica identity full;
alter table public.messages replica identity full;
