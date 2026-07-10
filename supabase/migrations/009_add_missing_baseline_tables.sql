-- The live project was missing agent_messages, system_errors, and
-- rate_limit_events entirely — despite the app code depending on all three
-- (agent bus audit trail, error dashboard, rate limiting). Failures were
-- silently swallowed (Supabase JS doesn't throw on insert errors unless you
-- check .error), so nothing crashed — the features just silently no-op'd.
-- This backfills what migrations 003/004/005 were meant to create.

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  correlation_id uuid not null,
  parent_id uuid references public.agent_messages(id) on delete set null,
  "from" text not null,
  "to" text not null,
  kind text not null check (kind in (
    'request', 'response', 'proposal', 'validation', 'flag', 'delegation', 'briefing'
  )),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_user_correlation
  on public.agent_messages (user_id, correlation_id, created_at);
create index if not exists agent_messages_user_created
  on public.agent_messages (user_id, created_at desc);

alter table public.agent_messages enable row level security;
drop policy if exists "agent_messages_owner_only" on public.agent_messages;
create policy "agent_messages_owner_only" on public.agent_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.system_errors (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  stack text,
  route text,
  user_id uuid references auth.users(id) on delete set null,
  request_id text,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_errors_created on public.system_errors (created_at desc);
create index if not exists system_errors_route_created on public.system_errors (route, created_at desc);

alter table public.system_errors enable row level security;
drop policy if exists "system_errors_admin_only" on public.system_errors;
create policy "system_errors_admin_only" on public.system_errors
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')
    )
  );
-- Service role (used by the API error handler to insert) bypasses RLS.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_bucket_created
  on public.rate_limit_events (bucket_key, created_at desc);

alter table public.rate_limit_events enable row level security;
-- No policies = no access for non-service-role users; app always uses the
-- admin client for rate limiting.
