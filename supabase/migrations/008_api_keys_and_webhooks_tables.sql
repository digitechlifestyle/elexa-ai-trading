-- Moves api_keys and outgoing_webhooks off user_metadata and into real
-- tables. Two concrete problems this fixes:
--
-- 1. Lost-update race: every write was updateUserById(user_metadata: {...})
--    — a full-object overwrite, not a merge. Two concurrent writes (e.g.
--    generating an API key in one tab while adding a webhook in another)
--    silently clobber each other; whichever admin.updateUserById() call
--    lands second wins and the other's write vanishes.
-- 2. API-key auth had to paginate through every user's user_metadata to
--    find a matching key hash (see api-auth.ts) because there was no index
--    to look up by. A unique index on hash makes that a single indexed
--    query instead of an O(users) scan.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Untitled',
  prefix text not null,
  hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_keys_user_created on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_owner_only" on public.api_keys;
create policy "api_keys_owner_only" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.outgoing_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Untitled',
  url text not null,
  events text[] not null,
  created_at timestamptz not null default now(),
  last_delivery_at timestamptz,
  last_delivery_status text
);

create index if not exists outgoing_webhooks_user_created
  on public.outgoing_webhooks (user_id, created_at desc);

alter table public.outgoing_webhooks enable row level security;

drop policy if exists "outgoing_webhooks_owner_only" on public.outgoing_webhooks;
create policy "outgoing_webhooks_owner_only" on public.outgoing_webhooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
