create table if not exists public.content_guidelines (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  required_mentions text[],
  required_hashtags text[],
  required_tags text[],
  dos text[],
  donts text[],
  min_duration_seconds integer,
  allowed_platforms text[] not null default array['youtube', 'tiktok', 'instagram'],
  created_at timestamp with time zone not null default now(),
  constraint content_guidelines_campaign_id_unique unique (campaign_id),
  constraint content_guidelines_min_duration_positive check (
    min_duration_seconds is null
    or min_duration_seconds > 0
  )
);

create index if not exists content_guidelines_campaign_id_idx
  on public.content_guidelines(campaign_id);

alter table public.content_guidelines enable row level security;

create or replace function private.creator_can_read_active_campaign_guidelines(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_is_creator()
    and exists (
      select 1
      from public.campaigns
      where campaigns.id = target_campaign_id
        and campaigns.status = 'active'
        and (
          campaigns.expires_at is null
          or campaigns.expires_at > now()
        )
    );
$$;

drop policy if exists "Businesses can manage own content guidelines." on public.content_guidelines;
drop policy if exists "Creators can read active campaign guidelines." on public.content_guidelines;

create policy "Businesses can manage own content guidelines."
  on public.content_guidelines
  for all
  to authenticated
  using (private.business_can_access_campaign(campaign_id))
  with check (private.business_can_access_campaign(campaign_id));

create policy "Creators can read active campaign guidelines."
  on public.content_guidelines
  for select
  to authenticated
  using (private.creator_can_read_active_campaign_guidelines(campaign_id));
