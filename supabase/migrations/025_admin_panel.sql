alter table public.profiles
  add column if not exists suspended_at timestamp with time zone;

create table if not exists public.pending_verifications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'tiktok', 'instagram')),
  verification_code text not null,
  created_at timestamp with time zone not null default now(),
  constraint pending_verifications_creator_platform_unique unique (creator_id, platform)
);

create index if not exists pending_verifications_creator_id_idx
  on public.pending_verifications(creator_id);

alter table public.pending_verifications enable row level security;

create policy "Admins can read pending verifications."
  on public.pending_verifications
  for select
  to authenticated
  using (private.current_user_is_admin());

create policy "Admins can delete pending verifications."
  on public.pending_verifications
  for delete
  to authenticated
  using (private.current_user_is_admin());

/*
  First admin setup:
  Replace MY_EMAIL_HERE with your Supabase Auth email, then run this once
  in the Supabase SQL editor.

  update public.profiles
  set role = 'admin'
  where id = (
    select id
    from auth.users
    where email = 'MY_EMAIL_HERE'
    limit 1
  );
*/
