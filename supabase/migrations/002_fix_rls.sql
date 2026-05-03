-- Production-ready RLS for Elexa AI Trading
-- Simple, non-recursive policies that work reliably

-- Profiles: no RLS (lookup table, non-sensitive)
alter table public.profiles disable row level security;

-- Trades: owner-only (no admin checks that cause recursion)
alter table public.trades enable row level security;
drop policy if exists "trades_owner_only" on public.trades;
create policy "trades_owner_only" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Journal: owner-only
alter table public.journal_entries enable row level security;
drop policy if exists "journal_owner_only" on public.journal_entries;
create policy "journal_owner_only" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Agent runs: owner-only
alter table public.agent_runs enable row level security;
drop policy if exists "agent_runs_owner_only" on public.agent_runs;
create policy "agent_runs_owner_only" on public.agent_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add better indexes for performance
drop index if exists trades_user_created;
drop index if exists agent_runs_user_created;
drop index if exists journal_user_created;

create index trades_user_created on public.trades (user_id, created_at desc);
create index agent_runs_user_created on public.agent_runs (user_id, created_at desc);
create index journal_user_created on public.journal_entries (user_id, created_at desc);
create index trades_symbol on public.trades (symbol, created_at desc);
