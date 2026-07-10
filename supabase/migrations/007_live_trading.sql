-- Live trading, built OFF by default. Requires LIVE_TRADING_ENABLED=true
-- (env, whole-platform kill switch) AND a per-user broker connection AND a
-- recorded disclaimer acceptance before any real order can be placed. See
-- src/app/api/trading/live/route.ts for where all three gates are checked.
--
-- Each user connects their OWN Alpaca live account (their own capital, their
-- own credentials). The app never pools or custodies user funds through a
-- shared account — that would make this a broker-dealer/investment-adviser
-- style service, which is a different regulatory category entirely and is
-- explicitly out of scope here.

create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange text not null check (exchange in ('alpaca')),
  -- AES-256-GCM ciphertext, base64: iv (12 bytes) || authTag (16 bytes) || ciphertext
  api_key_enc text not null,
  api_secret_enc text not null,
  last4 text not null, -- last 4 chars of the plaintext key, for display only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exchange)
);

alter table public.broker_connections enable row level security;

drop policy if exists "broker_connections_owner_only" on public.broker_connections;
create policy "broker_connections_owner_only" on public.broker_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.live_trading_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disclaimer_version text not null,
  accepted_at timestamptz not null default now(),
  ip text
);

alter table public.live_trading_consents enable row level security;

drop policy if exists "live_trading_consents_owner_only" on public.live_trading_consents;
create policy "live_trading_consents_owner_only" on public.live_trading_consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists live_trading_consents_user
  on public.live_trading_consents (user_id, accepted_at desc);
