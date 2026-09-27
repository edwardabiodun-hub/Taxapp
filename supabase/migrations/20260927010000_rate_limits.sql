create schema if not exists private;

create table if not exists private.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null check (hits >= 0)
);

-- Keep the counter table in the unexposed private schema, but expose only
-- this revoked-by-default RPC so Supabase clients can invoke it with the
-- service-role key without adding private to the API's exposed schemas.
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = private
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hits integer;
begin
  if p_limit <= 0 or p_window_seconds <= 0 or p_key is null or p_key = '' then
    raise exception 'Invalid rate-limit arguments';
  end if;

  insert into private.rate_limits(key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update
  set window_start = case
        when v_now - rate_limits.window_start >= make_interval(secs => p_window_seconds)
          then v_now
        else rate_limits.window_start
      end,
      hits = case
        when v_now - rate_limits.window_start >= make_interval(secs => p_window_seconds)
          then 1
        else rate_limits.hits + 1
      end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on table private.rate_limits from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
