alter table public.profiles
  add column if not exists last_seen timestamp with time zone default now(),
  add column if not exists deleted_at timestamp with time zone;

alter table public.businesses
  add column if not exists website_url text,
  add column if not exists phone_number text,
  add column if not exists address text,
  add column if not exists country text;

alter table public.creators
  add column if not exists profile_photo_url text,
  add column if not exists phone_number text,
  add column if not exists country text,
  add column if not exists date_of_birth date,
  add column if not exists youtube_connected boolean not null default false,
  add column if not exists youtube_channel_name text,
  add column if not exists tiktok_connected boolean not null default false,
  add column if not exists instagram_connected boolean not null default false,
  add column if not exists needs_reauth boolean not null default false;

create table if not exists public.email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  video_updates boolean not null default true,
  invitations boolean not null default true,
  campaign_alerts boolean not null default true,
  messages boolean not null default true,
  in_app_video_updates boolean not null default true,
  in_app_invitations boolean not null default true,
  in_app_campaign_alerts boolean not null default true,
  in_app_messages boolean not null default true,
  updated_at timestamp with time zone not null default now()
);

alter table public.email_preferences
  add column if not exists in_app_video_updates boolean not null default true,
  add column if not exists in_app_invitations boolean not null default true,
  add column if not exists in_app_campaign_alerts boolean not null default true,
  add column if not exists in_app_messages boolean not null default true,
  add column if not exists updated_at timestamp with time zone not null default now();

alter table public.email_preferences enable row level security;

drop policy if exists "Users can read own email preferences." on public.email_preferences;
drop policy if exists "Users can create own email preferences." on public.email_preferences;
drop policy if exists "Users can update own email preferences." on public.email_preferences;

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
