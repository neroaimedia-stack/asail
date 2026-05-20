create table if not exists public.invitations (
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

create unique index if not exists invitations_unique
  on public.invitations(campaign_id, creator_id)
  where status = 'pending';

create index if not exists invitations_campaign_id_idx
  on public.invitations(campaign_id);

create index if not exists invitations_creator_id_status_idx
  on public.invitations(creator_id, status);

alter table public.invitations enable row level security;

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
