-- Security audit fixes (2026-07-10)
--
-- 1. Migration 002 disabled RLS entirely on `public.profiles` ("lookup table,
--    non-sensitive"). But every admin gate in the app (admin/page.tsx,
--    admin/errors/page.tsx) works by reading profiles.role for the calling
--    user, and system_errors' RLS policy (004) also trusts profiles.role.
--    With RLS off, any authenticated user could PATCH their own `role` to
--    'admin'/'owner' directly via the Supabase REST API (bypassing the app
--    entirely) and pass every one of those checks. It also exposed every
--    user's email to any other authenticated caller. Re-enable RLS, scope
--    reads/updates to the caller's own row, and block role changes from
--    anything but the service role with a trigger (RLS's WITH CHECK can't
--    reliably compare NEW.role against OLD.role for every update shape).
--
-- 2. checkRateLimit() did a separate count-then-insert from the app, which
--    races under concurrent requests (two requests can both read "under
--    limit" before either inserts). Move both steps into one Postgres
--    function guarded by an advisory lock so concurrent calls for the same
--    bucket key serialize.

alter table public.profiles enable row level security;

drop policy if exists "users_own_profile" on public.profiles;
drop policy if exists "admins_all_profiles" on public.profiles;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Admin panel reads all profiles via the service-role client, which bypasses
-- RLS, so no "admins read all" policy is needed here.

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer as $$
begin
  if new.role is distinct from old.role and current_user <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_change on public.profiles;
create trigger prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- Atomic rate limit check + increment (replaces app-level count-then-insert)
create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns table(allowed boolean, remaining int)
language plpgsql as $$
declare
  v_used int;
  v_cutoff timestamptz := now() - (p_window_seconds || ' seconds')::interval;
begin
  -- Serialize concurrent calls for the same bucket key only.
  perform pg_advisory_xact_lock(hashtext(p_key));

  select count(*) into v_used
  from public.rate_limit_events
  where bucket_key = p_key and created_at >= v_cutoff;

  if v_used >= p_limit then
    return query select false, 0;
    return;
  end if;

  insert into public.rate_limit_events (bucket_key) values (p_key);

  if random() < 0.005 then
    delete from public.rate_limit_events where created_at < now() - interval '1 hour';
  end if;

  return query select true, greatest(0, p_limit - v_used - 1);
end;
$$;
