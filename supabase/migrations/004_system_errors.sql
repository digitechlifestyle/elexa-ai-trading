-- System error log — errors thrown in API routes are persisted here
-- for admin debugging without needing an external service.
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

create index if not exists system_errors_created
  on public.system_errors (created_at desc);

create index if not exists system_errors_route_created
  on public.system_errors (route, created_at desc);

-- RLS: admin/owner only
alter table public.system_errors enable row level security;

drop policy if exists "system_errors_admin_only" on public.system_errors;
create policy "system_errors_admin_only" on public.system_errors
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'owner')
    )
  );

-- Service role bypass (used by api-handler to insert)
-- This is implicit since service role bypasses RLS
