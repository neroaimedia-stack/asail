alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('business', 'creator', 'admin'));

create table if not exists public.disputes (
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

create index if not exists disputes_creator_id_idx on public.disputes(creator_id);
create index if not exists disputes_business_id_idx on public.disputes(business_id);
create index if not exists disputes_status_idx on public.disputes(status);

alter table public.disputes enable row level security;

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
