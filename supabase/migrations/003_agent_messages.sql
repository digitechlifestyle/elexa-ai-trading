-- Agent message bus — every inter-agent communication is logged here
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

-- Indexes for common access patterns
create index if not exists agent_messages_user_correlation
  on public.agent_messages (user_id, correlation_id, created_at);

create index if not exists agent_messages_user_created
  on public.agent_messages (user_id, created_at desc);

-- RLS: owner-only
alter table public.agent_messages enable row level security;

drop policy if exists "agent_messages_owner_only" on public.agent_messages;
create policy "agent_messages_owner_only" on public.agent_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
