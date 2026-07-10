-- Critical finding, unrelated to any of this repo's own code: this project's
-- database also runs public.get_vault_secret(text), which read directly
-- from vault.decrypted_secrets and was callable by the anon (unauthenticated)
-- and authenticated roles via PostgREST RPC — i.e. anyone on the internet
-- could call /rest/v1/rpc/get_vault_secret with any secret name and get the
-- decrypted plaintext back, no login required. The vault held a real Gmail
-- app password used by an email-fetch cron job on this shared project.
--
-- This function is for server-side/cron use — service_role bypasses grants
-- regardless, so revoking public/authenticated access doesn't break that.
revoke execute on function public.get_vault_secret(text) from anon, authenticated, public;

-- Same audit pass: pin search_path on SECURITY DEFINER / trigger functions
-- added or touched this session, closing the search-path-hijack vector
-- (an attacker creating objects earlier in an unpinned search_path to shadow
-- what the function calls, executing with its elevated privilege), and
-- revoke direct RPC access to functions that are only meant to fire as
-- triggers.

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and current_user <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns table(allowed boolean, remaining int)
language plpgsql
set search_path = public
as $$
declare
  v_used int;
  v_cutoff timestamptz := now() - (p_window_seconds || ' seconds')::interval;
begin
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

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

revoke execute on function public.prevent_role_self_escalation() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
