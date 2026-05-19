drop policy if exists "Creators can read campaigns for own videos." on public.campaigns;
drop policy if exists "Creators can read businesses for own videos." on public.businesses;

create policy "Creators can read campaigns for own videos."
  on public.campaigns
  for select
  to authenticated
  using (
    id in (
      select videos.campaign_id
      from public.videos
      join public.creators on creators.id = videos.creator_id
      where creators.user_id = (select auth.uid())
    )
  );

create policy "Creators can read businesses for own videos."
  on public.businesses
  for select
  to authenticated
  using (
    id in (
      select campaigns.business_id
      from public.campaigns
      join public.videos on videos.campaign_id = campaigns.id
      join public.creators on creators.id = videos.creator_id
      where creators.user_id = (select auth.uid())
    )
  );
