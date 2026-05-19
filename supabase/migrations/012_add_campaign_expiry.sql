alter table public.campaigns
  add column if not exists expires_at timestamp with time zone,
  add column if not exists auto_expired boolean not null default false;

create index if not exists campaigns_expiry_idx
  on public.campaigns(expires_at)
  where expires_at is not null;
