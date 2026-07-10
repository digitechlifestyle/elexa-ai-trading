-- Two cleanups from a broader audit pass:
--
-- 1. trades/journal_entries/agent_runs each carried 5-6 overlapping
--    policies from multiple past setup passes (all semantically "owner can
--    do X"), plus recursive profiles-lookup admin-check policies. Not a
--    security gap — permissive policies OR together — but needless
--    complexity. Admin panel reads via the service-role client, which
--    bypasses RLS entirely, so no admin-check policy is needed on these
--    tables.
--
-- 2. Every policy using bare auth.uid() gets re-evaluated per row.
--    Wrapping it as (select auth.uid()) lets Postgres cache it once per
--    query (InitPlan) instead — same semantics, real perf win at scale.
--    Applied to every policy this project's migrations have created.

drop policy if exists "Users can create trades" on public.trades;
drop policy if exists "Users can update their own trades" on public.trades;
drop policy if exists "Users can view their own trades" on public.trades;
drop policy if exists "admins_all_trades" on public.trades;
drop policy if exists "users_own_trades" on public.trades;
drop policy if exists "trades_owner_only" on public.trades;
create policy "trades_owner_only" on public.trades
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can create journal entries" on public.journal_entries;
drop policy if exists "Users can update their own journal entries" on public.journal_entries;
drop policy if exists "Users can view their own journal entries" on public.journal_entries;
drop policy if exists "users_own_journal" on public.journal_entries;
drop policy if exists "journal_owner_only" on public.journal_entries;
create policy "journal_owner_only" on public.journal_entries
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can create agent runs" on public.agent_runs;
drop policy if exists "Users can update their own agent runs" on public.agent_runs;
drop policy if exists "Users can view their own agent runs" on public.agent_runs;
drop policy if exists "admins_all_agent_runs" on public.agent_runs;
drop policy if exists "users_own_agent_runs" on public.agent_runs;
drop policy if exists "agent_runs_owner_only" on public.agent_runs;
create policy "agent_runs_owner_only" on public.agent_runs
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "agent_messages_owner_only" on public.agent_messages;
create policy "agent_messages_owner_only" on public.agent_messages
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "system_errors_admin_only" on public.system_errors;
create policy "system_errors_admin_only" on public.system_errors
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role in ('admin', 'owner')
    )
  );

drop policy if exists "broker_connections_owner_only" on public.broker_connections;
create policy "broker_connections_owner_only" on public.broker_connections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "live_trading_consents_owner_only" on public.live_trading_consents;
create policy "live_trading_consents_owner_only" on public.live_trading_consents
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "api_keys_owner_only" on public.api_keys;
create policy "api_keys_owner_only" on public.api_keys
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "outgoing_webhooks_owner_only" on public.outgoing_webhooks;
create policy "outgoing_webhooks_owner_only" on public.outgoing_webhooks
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
