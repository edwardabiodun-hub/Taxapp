-- Approved public tax content is read by the service role only. No browser
-- role receives table access, and there are no user-facing RLS policies.
create table public.support_knowledge (
  id text primary key,
  term text not null,
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  definition text not null,
  statutory_reference text not null,
  source_url text not null,
  jurisdiction text not null default 'NG',
  effective_from date not null,
  effective_to date,
  review_owner text not null,
  last_verified date not null,
  review_status text not null check (review_status in ('verified', 'needs_review')),
  search_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

alter table public.support_knowledge enable row level security;
revoke all on table public.support_knowledge from public, anon, authenticated;
grant select on table public.support_knowledge to service_role;

create index support_knowledge_search_idx
  on public.support_knowledge using gin (to_tsvector('english', search_text));

create trigger support_knowledge_set_updated_at
  before update on public.support_knowledge
  for each row execute function public.set_updated_at();

create or replace function public.search_support_knowledge(p_query text, p_as_of date, p_limit integer default 5)
returns table (
  id text,
  term text,
  aliases jsonb,
  definition text,
  statutory_reference text,
  source_url text,
  jurisdiction text,
  effective_from date,
  effective_to date,
  last_verified date
)
language sql stable security invoker
set search_path = ''
as $$
  select k.id, k.term, k.aliases, k.definition, k.statutory_reference,
         k.source_url, k.jurisdiction, k.effective_from, k.effective_to,
         k.last_verified
  from public.support_knowledge k
  where k.jurisdiction = 'NG'
    and k.review_status = 'verified'
    and k.effective_from <= p_as_of
    and (k.effective_to is null or k.effective_to >= p_as_of)
    and to_tsvector('english', k.search_text) @@ websearch_to_tsquery('english', p_query)
  order by ts_rank(to_tsvector('english', k.search_text), websearch_to_tsquery('english', p_query)) desc, k.id
  limit least(greatest(coalesce(p_limit, 5), 0), 5);
$$;

revoke all on function public.search_support_knowledge(text, date, integer) from public, anon, authenticated;
grant execute on function public.search_support_knowledge(text, date, integer) to service_role;

-- Private summaries run as the JWT caller. RLS on each source table remains
-- active and every query also states its ownership predicate explicitly.
create or replace function public.get_my_declaration_status()
returns table (
  declaration_id uuid,
  tax_year text,
  declaration_type text,
  status text,
  document_count integer,
  created_at timestamptz
)
language sql stable security invoker
set search_path = ''
as $$
  select d.id, d.tax_year, d.type, d.status,
         case when jsonb_typeof(d.documents) = 'array'
           then jsonb_array_length(d.documents) else 0 end,
         d.created_at
  from public.declarations d
  where d.user_id = auth.uid()
  order by d.created_at desc, d.id;
$$;

revoke all on function public.get_my_declaration_status() from public, anon, authenticated;
grant execute on function public.get_my_declaration_status() to authenticated;

create or replace function public.get_my_support_message_summary()
returns table (unread_count bigint)
language sql stable security invoker
set search_path = ''
as $$
  select count(*) as unread_count
  from public.messages m
  where m.recipient_user_id = auth.uid()
    and m.read_at is null;
$$;

revoke all on function public.get_my_support_message_summary() from public, anon, authenticated;
grant execute on function public.get_my_support_message_summary() to authenticated;

create or replace function public.get_my_profile_completion()
returns table (is_complete boolean, missing_fields text[])
language sql stable security invoker
set search_path = ''
as $$
  select coalesce(cardinality(own_profile.missing_fields) = 0, false),
         coalesce(own_profile.missing_fields, array['profile']::text[])
  from (select auth.uid() as caller_id) caller
  left join lateral (
    select array_remove(array[
      case when nullif(btrim(p.name), '') is null then 'name' end,
      case when nullif(btrim(p.phone), '') is null then 'phone' end,
      case when nullif(btrim(p.tax_id), '') is null then 'tax_id' end,
      case when nullif(btrim(p.country), '') is null then 'country' end,
      case when p.date_of_birth is null then 'date_of_birth' end,
      case when nullif(btrim(p.country_of_birth), '') is null then 'country_of_birth' end,
      case when nullif(btrim(p.gender), '') is null then 'gender' end,
      case when nullif(btrim(p.nationality), '') is null then 'nationality' end
    ], null)::text[] as missing_fields
    from public.profiles p
    where p.id = auth.uid()
  ) own_profile on true;
$$;

revoke all on function public.get_my_profile_completion() from public, anon, authenticated;
grant execute on function public.get_my_profile_completion() to authenticated;
