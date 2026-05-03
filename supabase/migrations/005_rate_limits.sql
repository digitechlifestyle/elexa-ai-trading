-- Rate limiting — sliding window counter
-- Each request inserts a row; count rows in the last N seconds to check the limit.
create table if not exists public.rate_limit_events (
  id bigserial primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_bucket_created
  on public.rate_limit_events (bucket_key, created_at desc);

-- Cleanup function: delete events older than 1 hour
-- Call this periodically (e.g., from a cron job or after each insert with 0.1% probability)
create or replace function public.cleanup_old_rate_limit_events()
returns void as $$
begin
  delete from public.rate_limit_events
  where created_at < now() - interval '1 hour';
end;
$$ language plpgsql;

-- RLS: deny direct access. All access through service role / admin client.
alter table public.rate_limit_events enable row level security;
-- No policies = no access for non-service-role users
