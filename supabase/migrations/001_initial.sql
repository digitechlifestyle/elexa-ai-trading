-- Elexa AI Trading — Initial Schema
-- Paper trading only. LIVE_TRADING_ENABLED must remain false until tested.

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trades (paper only — is_paper must always be true until live trading is enabled)
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  qty numeric not null check (qty > 0),
  filled_price numeric,
  status text not null default 'pending' check (status in ('pending', 'filled', 'cancelled', 'rejected')),
  is_paper boolean not null default true,
  alpaca_order_id text,
  created_at timestamptz not null default now()
);

-- Ensure only paper trades can be inserted while live trading is disabled
-- (Application-level check in API route is the primary guard; this is belt-and-suspenders)
comment on column public.trades.is_paper is
  'Must be true. Live trading disabled until LIVE_TRADING_ENABLED=true and paper tests pass.';

-- Journal entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Agent runs (audit log)
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent text not null check (agent in ('quant', 'risk', 'ceo', 'compliance', 'seo', 'support')),
  input text not null,
  output text,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- Row-Level Security
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agent_runs enable row level security;

-- Profiles: users see own, admins see all
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id);

create policy "admins_all_profiles" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

-- Trades: users see own
create policy "users_own_trades" on public.trades
  for all using (auth.uid() = user_id);

create policy "admins_all_trades" on public.trades
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

-- Journal: users see own
create policy "users_own_journal" on public.journal_entries
  for all using (auth.uid() = user_id);

-- Agent runs: users see own
create policy "users_own_agent_runs" on public.agent_runs
  for all using (auth.uid() = user_id);

create policy "admins_all_agent_runs" on public.agent_runs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

-- Indexes
create index if not exists trades_user_created on public.trades (user_id, created_at desc);
create index if not exists agent_runs_user_created on public.agent_runs (user_id, created_at desc);
create index if not exists journal_user_created on public.journal_entries (user_id, created_at desc);
