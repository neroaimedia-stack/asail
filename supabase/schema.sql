-- Asail complete Supabase schema
-- Run this in the Supabase SQL editor.
-- This resets the app tables listed below so the schema is predictable.

begin;

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop schema if exists private cascade;

drop table if exists public.payouts cascade;
drop table if exists public.videos cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.creators cascade;
drop table if exists public.businesses cascade;
drop table if exists public.terms_accepted cascade;
drop table if exists public.profiles cascade;
drop type if exists public.user_role cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('business', 'creator')),
  full_name text not null,
  avatar_url text,
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

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  handle text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  categories text[] not null default '{}',
  bio text,
  created_at timestamp with time zone not null default now(),
  constraint creators_user_id_unique unique (user_id)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  brief text not null,
  instructions text not null,
  total_budget numeric not null check (total_budget >= 0),
  spent_budget numeric not null default 0 check (spent_budget >= 0),
  cpm_rate numeric not null check (cpm_rate >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamp with time zone not null default now(),
  constraint campaigns_spent_lte_total check (spent_budget <= total_budget)
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
create index campaigns_business_id_idx on public.campaigns(business_id);
create index campaigns_status_idx on public.campaigns(status);
create index videos_campaign_id_idx on public.videos(campaign_id);
create index videos_creator_id_idx on public.videos(creator_id);
create index payouts_creator_id_idx on public.payouts(creator_id);
create index payouts_video_id_idx on public.payouts(video_id);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.terms_accepted enable row level security;
alter table public.creators enable row level security;
alter table public.campaigns enable row level security;
alter table public.videos enable row level security;
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

commit;
