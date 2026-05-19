drop policy if exists "Creators can read businesses with active campaigns." on public.businesses;

create policy "Creators can read businesses with active campaigns."
  on public.businesses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.creators
      where creators.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.campaigns
      where campaigns.business_id = businesses.id
        and campaigns.status = 'active'
    )
  );
