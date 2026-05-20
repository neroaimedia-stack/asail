-- Asail complete Supabase schema
-- Run this in the Supabase SQL editor.
-- This resets the app tables listed below so the schema is predictable.

begin;

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop schema if exists private cascade;

drop table if exists public.payouts cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.email_preferences cascade;
drop table if exists public.invitations cascade;
drop table if exists public.video_history cascade;
drop table if exists public.videos cascade;
drop table if exists public.content_guidelines cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.creators cascade;
drop table if exists public.businesses cascade;
drop table if exists public.terms_accepted cascade;
drop table if exists public.notifications cascade;
drop table if exists public.profiles cascade;
drop type if exists public.user_role cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('business', 'creator', 'admin')),
  full_name text not null,
  avatar_url text,
  last_seen timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  category text not null,
  description text,
  logo_url text,
  created_at timestamp with time zone not null default now(),
  constraint businesses_user_id_unique unique (user_id)
);

create table public.terms_accepted (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamp with time zone not null default now(),
  ip_address text,
  terms_version text not null default '1.0',
  constraint terms_accepted_user_id_unique unique (user_id)
);

create table public.email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  video_updates boolean not null default true,
  invitations boolean not null default true,
  campaign_alerts boolean not null default true,
  messages boolean not null default true
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  handle text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  categories text[] not null default '{}',
  verified boolean not null default false,
  bio text,
  fts tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(handle, '') || ' ' ||
      coalesce(bio, '') || ' ' ||
      coalesce(array_to_string(categories, ' '), '')
    )
  ) stored,
  created_at timestamp with time zone not null default now(),
  constraint creators_user_id_unique unique (user_id)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  brief text not null,
  instructions text not null,
  fts tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(brief, '') || ' ' ||
      coalesce(instructions, '')
    )
  ) stored,
  total_budget numeric not null check (total_budget >= 0),
  spent_budget numeric not null default 0 check (spent_budget >= 0),
  cpm_rate numeric not null check (cpm_rate >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  expires_at timestamp with time zone,
  auto_expired boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint campaigns_spent_lte_total check (spent_budget <= total_budget)
);

create table public.content_guidelines (
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

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  video_url text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  view_count integer not null default 0 check (view_count >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  rejection_reason text,
  payout_amount numeric not null default 0 check (payout_amount >= 0),
  payout_status text not null default 'unpaid' check (payout_status in ('unpaid', 'paid')),
  submitted_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone,
  constraint rejected_videos_need_reason check (
    status <> 'rejected'
    or rejection_reason is not null
  )
);

create table public.video_history (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  reason text not null,
  evidence_url text,
  status text not null default 'open' check (
    status in (
      'open',
      'under_review',
      'resolved_creator',
      'resolved_business',
      'closed'
    )
  ),
  admin_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint disputes_video_id_unique unique (video_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'video_submitted',
      'video_accepted',
      'video_rejected',
      'dispute_opened',
      'dispute_resolved',
      'campaign_expiring',
      'campaign_expired',
      'invitation_received',
      'invitation_accepted',
      'new_message',
      'payout_sent'
    )
  ),
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  message text,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'declined', 'expired')
  ),
  created_at timestamp with time zone not null default now(),
  responded_at timestamp with time zone,
  expires_at timestamp with time zone not null default now() + interval '7 days'
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  last_message_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
  created_at timestamp with time zone not null default now()
);

create index businesses_user_id_idx on public.businesses(user_id);
create index terms_accepted_user_id_idx on public.terms_accepted(user_id);
create index creators_user_id_idx on public.creators(user_id);
create index creators_fts_idx on public.creators using gin(fts);
create index campaigns_business_id_idx on public.campaigns(business_id);
create index campaigns_status_idx on public.campaigns(status);
create index campaigns_fts_idx on public.campaigns using gin(fts);
create index campaigns_expiry_idx on public.campaigns(expires_at) where expires_at is not null;
create index content_guidelines_campaign_id_idx on public.content_guidelines(campaign_id);
create index videos_campaign_id_idx on public.videos(campaign_id);
create index videos_creator_id_idx on public.videos(creator_id);
create index videos_creator_campaign_status_idx on public.videos(creator_id, campaign_id, status);
create index videos_creator_submitted_at_idx on public.videos(creator_id, submitted_at desc);
create index videos_creator_campaign_submitted_at_idx on public.videos(creator_id, campaign_id, submitted_at desc);
create index video_history_video_id_idx on public.video_history(video_id);
create index video_history_created_at_idx on public.video_history(created_at);
create index disputes_creator_id_idx on public.disputes(creator_id);
create index disputes_business_id_idx on public.disputes(business_id);
create index disputes_status_idx on public.disputes(status);
create index notifications_user_id_idx on public.notifications(user_id, created_at desc);
create unique index invitations_unique on public.invitations(campaign_id, creator_id) where status = 'pending';
create index invitations_campaign_id_idx on public.invitations(campaign_id);
create index invitations_creator_id_status_idx on public.invitations(creator_id, status);
create unique index conversations_unique
  on public.conversations(
    business_id,
    creator_id,
    coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index conversations_business_id_idx on public.conversations(business_id, last_message_at desc);
create index conversations_creator_id_idx on public.conversations(creator_id, last_message_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at asc);
create index payouts_creator_id_idx on public.payouts(creator_id);
create index payouts_video_id_idx on public.payouts(video_id);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.terms_accepted enable row level security;
alter table public.email_preferences enable row level security;
alter table public.creators enable row level security;
alter table public.campaigns enable row level security;
alter table public.content_guidelines enable row level security;
alter table public.videos enable row level security;
alter table public.video_history enable row level security;
alter table public.disputes enable row level security;
alter table public.notifications enable row level security;
alter table public.invitations enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.payouts enable row level security;

create schema private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.current_user_is_creator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.creators
    where creators.user_id = auth.uid()
  );
$$;

create or replace function private.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses
    where businesses.id = target_business_id
      and businesses.user_id = auth.uid()
  );
$$;

create or replace function private.is_creator_owner(target_creator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.creators
    where creators.id = target_creator_id
      and creators.user_id = auth.uid()
  );
$$;

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function private.is_conversation_participant(
  target_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations
    where conversations.id = target_conversation_id
      and (
        private.is_business_owner(conversations.business_id)
        or private.is_creator_owner(conversations.creator_id)
      )
  );
$$;

create or replace function private.creator_can_read_active_business(target_business_id uuid)
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
      where campaigns.business_id = target_business_id
        and campaigns.status = 'active'
    );
$$;

create or replace function private.creator_can_read_business_for_video(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns
    join public.videos on videos.campaign_id = campaigns.id
    join public.creators on creators.id = videos.creator_id
    where campaigns.business_id = target_business_id
      and creators.user_id = auth.uid()
  );
$$;

create or replace function private.creator_can_read_campaign_for_video(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.videos
    join public.creators on creators.id = videos.creator_id
    where videos.campaign_id = target_campaign_id
      and creators.user_id = auth.uid()
  );
$$;

create or replace function private.business_can_access_campaign(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns
    join public.businesses on businesses.id = campaigns.business_id
    where campaigns.id = target_campaign_id
      and businesses.user_id = auth.uid()
  );
$$;

create or replace function private.business_can_access_video(target_video_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.videos
    join public.campaigns on campaigns.id = videos.campaign_id
    join public.businesses on businesses.id = campaigns.business_id
    where videos.id = target_video_id
      and businesses.user_id = auth.uid()
  );
$$;

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

create or replace function private.record_video_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.video_history (video_id, status, changed_by, note)
  values (
    new.id,
    new.status,
    null,
    'Status changed from ' || old.status || ' to ' || new.status
  );

  return new;
end;
$$;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Business users can upload own logos." on storage.objects;
drop policy if exists "Business users can update own logos." on storage.objects;
drop policy if exists "Business users can read logos." on storage.objects;

create policy "Business users can upload own logos."
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Business users can update own logos."
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


create policy "Profiles are readable by owner only."
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are insertable by owner only."
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Profiles are updatable by owner only."
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Businesses can read own business."
  on public.businesses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Businesses can insert own business."
  on public.businesses
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Businesses can update own business."
  on public.businesses
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can read own terms acceptance."
  on public.terms_accepted
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Authenticated users can insert terms acceptance."
  on public.terms_accepted
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can read own email preferences."
  on public.email_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create own email preferences."
  on public.email_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own email preferences."
  on public.email_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Creators can read businesses with active campaigns."
  on public.businesses
  for select
  to authenticated
  using (private.creator_can_read_active_business(id));

create policy "Creators can read businesses for own videos."
  on public.businesses
  for select
  to authenticated
  using (private.creator_can_read_business_for_video(id));

create policy "Creators can read own creator profile."
  on public.creators
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Creators can insert own creator profile."
  on public.creators
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Creators can update own creator profile."
  on public.creators
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Businesses can manage own campaigns."
  on public.campaigns
  for all
  to authenticated
  using (private.is_business_owner(business_id))
  with check (private.is_business_owner(business_id));

create policy "Creators can read active campaigns."
  on public.campaigns
  for select
  to authenticated
  using (
    status = 'active'
    and private.current_user_is_creator()
  );

create policy "Creators can read campaigns for own videos."
  on public.campaigns
  for select
  to authenticated
  using (private.creator_can_read_campaign_for_video(id));

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

create policy "Creators can read own videos."
  on public.videos
  for select
  to authenticated
  using (
    creator_id in (
      select id
      from public.creators
      where user_id = (select auth.uid())
    )
  );

create policy "Creators can submit own videos."
  on public.videos
  for insert
  to authenticated
  with check (
    creator_id in (
      select id
      from public.creators
      where user_id = (select auth.uid())
    )
  );

create policy "Creators can update own pending videos."
  on public.videos
  for update
  to authenticated
  using (
    status = 'pending'
    and creator_id in (
      select id
      from public.creators
      where user_id = (select auth.uid())
    )
  )
  with check (
    creator_id in (
      select id
      from public.creators
      where user_id = (select auth.uid())
    )
  );

create policy "Businesses can see videos for own campaigns."
  on public.videos
  for select
  to authenticated
  using (private.business_can_access_campaign(campaign_id));

create policy "Businesses can review videos for own campaigns."
  on public.videos
  for update
  to authenticated
  using (private.business_can_access_campaign(campaign_id))
  with check (private.business_can_access_campaign(campaign_id));

create policy "Creators can read own video history."
  on public.video_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.videos
      where videos.id = video_history.video_id
        and private.is_creator_owner(videos.creator_id)
    )
  );

create policy "Businesses can read campaign video history."
  on public.video_history
  for select
  to authenticated
  using (private.business_can_access_video(video_id));

create policy "Creators can read own disputes."
  on public.disputes
  for select
  to authenticated
  using (private.is_creator_owner(creator_id));

create policy "Creators can create own disputes."
  on public.disputes
  for insert
  to authenticated
  with check (
    private.is_creator_owner(creator_id)
    and exists (
      select 1
      from public.videos
      join public.campaigns on campaigns.id = videos.campaign_id
      where videos.id = disputes.video_id
        and videos.creator_id = disputes.creator_id
        and videos.status = 'rejected'
        and campaigns.business_id = disputes.business_id
        and videos.reviewed_at >= now() - interval '7 days'
    )
  );

create policy "Businesses can read campaign disputes."
  on public.disputes
  for select
  to authenticated
  using (private.is_business_owner(business_id));

create policy "Admins can read all disputes."
  on public.disputes
  for select
  to authenticated
  using (private.current_user_is_admin());

create policy "Admins can update disputes."
  on public.disputes
  for update
  to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());

create policy "Users can read own notifications."
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update own notifications."
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Businesses can create own invitations."
  on public.invitations
  for insert
  to authenticated
  with check (private.is_business_owner(business_id));

create policy "Businesses can read own invitations."
  on public.invitations
  for select
  to authenticated
  using (private.is_business_owner(business_id));

create policy "Creators can read sent invitations."
  on public.invitations
  for select
  to authenticated
  using (private.is_creator_owner(creator_id));

create policy "Creators can respond to invitations."
  on public.invitations
  for update
  to authenticated
  using (private.is_creator_owner(creator_id))
  with check (private.is_creator_owner(creator_id));

create policy "Users can read conversations they participate in."
  on public.conversations
  for select
  to authenticated
  using (
    private.is_business_owner(business_id)
    or private.is_creator_owner(creator_id)
  );

create policy "Users can read messages in own conversations."
  on public.messages
  for select
  to authenticated
  using (private.is_conversation_participant(conversation_id));

create policy "Users can insert messages in own conversations."
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_participant(conversation_id)
  );

create policy "Creators can read own payouts."
  on public.payouts
  for select
  to authenticated
  using (private.is_creator_owner(creator_id));

create policy "Businesses can read payouts for own campaign videos."
  on public.payouts
  for select
  to authenticated
  using (private.business_can_access_video(video_id));

create policy "Businesses can create payouts for own campaign videos."
  on public.payouts
  for insert
  to authenticated
  with check (private.business_can_access_video(video_id));

create policy "Businesses can update payouts for own campaign videos."
  on public.payouts
  for update
  to authenticated
  using (private.business_can_access_video(video_id))
  with check (private.business_can_access_video(video_id));

create or replace view public.earnings_summary
with (security_invoker = true)
as
select
  v.creator_id,
  v.id as video_id,
  v.campaign_id,
  v.view_count,
  v.payout_amount,
  v.payout_status,
  v.status as video_status,
  v.platform,
  c.cpm_rate,
  c.title as campaign_title,
  b.business_name,
  v.submitted_at
from public.videos v
join public.campaigns c on v.campaign_id = c.id
join public.businesses b on c.business_id = b.id
where v.status = 'accepted';

create or replace view public.business_spend_summary
with (security_invoker = true)
as
select
  c.business_id,
  c.id as campaign_id,
  c.title as campaign_title,
  c.total_budget,
  c.spent_budget,
  c.cpm_rate,
  coalesce(sum(v.payout_amount), 0) as total_paid_out,
  coalesce(sum(v.view_count), 0) as total_views,
  count(v.id) as total_videos
from public.campaigns c
left join public.videos v
  on v.campaign_id = c.id
  and v.status = 'accepted'
group by c.id, c.business_id, c.title, c.total_budget, c.spent_budget, c.cpm_rate;

create or replace view public.creator_leaderboard as
select
  cr.id as creator_id,
  cr.user_id,
  p.full_name,
  cr.handle,
  cr.platform,
  cr.categories,
  cr.verified,
  coalesce(sum(v.view_count), 0) as total_views,
  coalesce(sum(v.payout_amount), 0) as total_earned,
  count(v.id) as total_videos_accepted,
  coalesce(avg(v.view_count), 0) as avg_views_per_video
from public.creators cr
join public.profiles p on cr.user_id = p.id
left join public.videos v
  on v.creator_id = cr.id
  and v.status = 'accepted'
group by cr.id, cr.user_id, p.full_name, cr.handle, cr.platform, cr.categories, cr.verified
order by total_views desc;

grant select on public.earnings_summary to authenticated;
grant select on public.business_spend_summary to authenticated;
revoke all on public.creator_leaderboard from anon;
revoke all on public.creator_leaderboard from public;
grant select on public.creator_leaderboard to authenticated;

create or replace function public.search_campaigns(search_query text)
returns table (
  id uuid,
  title text,
  brief text,
  total_budget numeric,
  spent_budget numeric,
  cpm_rate numeric,
  business_name text,
  business_category text,
  business_logo_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.title,
    c.brief,
    c.total_budget,
    c.spent_budget,
    c.cpm_rate,
    b.business_name,
    b.category as business_category,
    b.logo_url as business_logo_url
  from public.campaigns c
  join public.businesses b on b.id = c.business_id
  where c.fts @@ plainto_tsquery('english', search_query)
    and c.status = 'active'
    and (c.expires_at is null or c.expires_at > now())
  order by ts_rank(c.fts, plainto_tsquery('english', search_query)) desc
  limit 20;
$$;

create or replace function public.search_creators(search_query text)
returns table (
  creator_id uuid,
  user_id uuid,
  full_name text,
  handle text,
  platform text,
  categories text[],
  verified boolean,
  total_views bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    cr.id as creator_id,
    cr.user_id,
    p.full_name,
    cr.handle,
    cr.platform,
    cr.categories,
    cr.verified,
    coalesce(sum(v.view_count), 0)::bigint as total_views
  from public.creators cr
  join public.profiles p on cr.user_id = p.id
  left join public.videos v
    on v.creator_id = cr.id
    and v.status = 'accepted'
  where cr.fts @@ plainto_tsquery('english', search_query)
    and cr.verified = true
  group by cr.id, p.full_name
  order by total_views desc
  limit 20;
$$;

revoke all on function public.search_campaigns(text) from public;
revoke all on function public.search_campaigns(text) from anon;
revoke all on function public.search_campaigns(text) from authenticated;
revoke all on function public.search_creators(text) from public;
revoke all on function public.search_creators(text) from anon;
revoke all on function public.search_creators(text) from authenticated;
grant execute on function public.search_campaigns(text) to service_role;
grant execute on function public.search_creators(text) to service_role;

create or replace function public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_link
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke execute on function public.create_notification(uuid, text, text, text, text) from public;
revoke execute on function public.create_notification(uuid, text, text, text, text) from anon;
revoke execute on function public.create_notification(uuid, text, text, text, text) from authenticated;
grant execute on function public.create_notification(uuid, text, text, text, text) to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'role',
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger on_video_status_change
  after update on public.videos
  for each row
  when (new.status is distinct from old.status)
  execute function private.record_video_status_change();

commit;
