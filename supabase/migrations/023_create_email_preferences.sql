alter table public.profiles
  add column if not exists last_seen timestamp with time zone;

create table if not exists public.email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  video_updates boolean not null default true,
  invitations boolean not null default true,
  campaign_alerts boolean not null default true,
  messages boolean not null default true
);

alter table public.email_preferences enable row level security;

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
