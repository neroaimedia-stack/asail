create schema if not exists private;

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

drop policy if exists "Creators can read businesses with active campaigns." on public.businesses;
drop policy if exists "Creators can read businesses for own videos." on public.businesses;
drop policy if exists "Businesses can manage own campaigns." on public.campaigns;
drop policy if exists "Creators can read active campaigns." on public.campaigns;
drop policy if exists "Creators can read campaigns for own videos." on public.campaigns;
drop policy if exists "Businesses can see videos for own campaigns." on public.videos;
drop policy if exists "Businesses can review videos for own campaigns." on public.videos;
drop policy if exists "Creators can read own payouts." on public.payouts;
drop policy if exists "Businesses can read payouts for own campaign videos." on public.payouts;
drop policy if exists "Businesses can create payouts for own campaign videos." on public.payouts;
drop policy if exists "Businesses can update payouts for own campaign videos." on public.payouts;

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
