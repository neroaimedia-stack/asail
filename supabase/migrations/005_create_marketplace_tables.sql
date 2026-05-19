create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  category text not null,
  description text,
  logo_url text,
  created_at timestamp with time zone not null default now(),
  constraint businesses_user_id_unique unique (user_id)
);

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  handle text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  categories text[] not null default '{}',
  bio text,
  created_at timestamp with time zone not null default now(),
  constraint creators_user_id_unique unique (user_id)
);

create table if not exists public.campaigns (
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

create table if not exists public.videos (
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

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
  created_at timestamp with time zone not null default now()
);

create index if not exists businesses_user_id_idx on public.businesses(user_id);
create index if not exists creators_user_id_idx on public.creators(user_id);
create index if not exists campaigns_business_id_idx on public.campaigns(business_id);
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists videos_campaign_id_idx on public.videos(campaign_id);
create index if not exists videos_creator_id_idx on public.videos(creator_id);
create index if not exists payouts_creator_id_idx on public.payouts(creator_id);
create index if not exists payouts_video_id_idx on public.payouts(video_id);

alter table public.businesses enable row level security;
alter table public.creators enable row level security;
alter table public.campaigns enable row level security;
alter table public.videos enable row level security;
alter table public.payouts enable row level security;

drop policy if exists "Businesses can read own business." on public.businesses;
drop policy if exists "Businesses can insert own business." on public.businesses;
drop policy if exists "Businesses can update own business." on public.businesses;
drop policy if exists "Creators can read own creator profile." on public.creators;
drop policy if exists "Creators can insert own creator profile." on public.creators;
drop policy if exists "Creators can update own creator profile." on public.creators;
drop policy if exists "Businesses can manage own campaigns." on public.campaigns;
drop policy if exists "Creators can read active campaigns." on public.campaigns;
drop policy if exists "Creators can read own videos." on public.videos;
drop policy if exists "Creators can submit own videos." on public.videos;
drop policy if exists "Creators can update own pending videos." on public.videos;
drop policy if exists "Businesses can see videos for own campaigns." on public.videos;
drop policy if exists "Businesses can review videos for own campaigns." on public.videos;
drop policy if exists "Creators can read own payouts." on public.payouts;
drop policy if exists "Businesses can read payouts for own campaign videos." on public.payouts;
drop policy if exists "Businesses can create payouts for own campaign videos." on public.payouts;
drop policy if exists "Businesses can update payouts for own campaign videos." on public.payouts;

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
  using (
    business_id in (
      select id from public.businesses where user_id = (select auth.uid())
    )
  )
  with check (
    business_id in (
      select id from public.businesses where user_id = (select auth.uid())
    )
  );

create policy "Creators can read active campaigns."
  on public.campaigns
  for select
  to authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.creators where user_id = (select auth.uid())
    )
  );

create policy "Creators can read own videos."
  on public.videos
  for select
  to authenticated
  using (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

create policy "Creators can submit own videos."
  on public.videos
  for insert
  to authenticated
  with check (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

create policy "Creators can update own pending videos."
  on public.videos
  for update
  to authenticated
  using (
    status = 'pending'
    and creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  )
  with check (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

create policy "Businesses can see videos for own campaigns."
  on public.videos
  for select
  to authenticated
  using (
    campaign_id in (
      select campaigns.id
      from public.campaigns
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  );

create policy "Businesses can review videos for own campaigns."
  on public.videos
  for update
  to authenticated
  using (
    campaign_id in (
      select campaigns.id
      from public.campaigns
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  )
  with check (
    campaign_id in (
      select campaigns.id
      from public.campaigns
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  );

create policy "Creators can read own payouts."
  on public.payouts
  for select
  to authenticated
  using (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

create policy "Businesses can read payouts for own campaign videos."
  on public.payouts
  for select
  to authenticated
  using (
    video_id in (
      select videos.id
      from public.videos
      join public.campaigns on campaigns.id = videos.campaign_id
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  );

create policy "Businesses can create payouts for own campaign videos."
  on public.payouts
  for insert
  to authenticated
  with check (
    video_id in (
      select videos.id
      from public.videos
      join public.campaigns on campaigns.id = videos.campaign_id
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  );

create policy "Businesses can update payouts for own campaign videos."
  on public.payouts
  for update
  to authenticated
  using (
    video_id in (
      select videos.id
      from public.videos
      join public.campaigns on campaigns.id = videos.campaign_id
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  )
  with check (
    video_id in (
      select videos.id
      from public.videos
      join public.campaigns on campaigns.id = videos.campaign_id
      join public.businesses on businesses.id = campaigns.business_id
      where businesses.user_id = (select auth.uid())
    )
  );
