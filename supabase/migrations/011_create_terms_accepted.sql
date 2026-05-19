create table if not exists public.terms_accepted (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamp with time zone not null default now(),
  ip_address text,
  terms_version text not null default '1.0',
  constraint terms_accepted_user_id_unique unique (user_id)
);

create index if not exists terms_accepted_user_id_idx
  on public.terms_accepted(user_id);

alter table public.terms_accepted enable row level security;

drop policy if exists "Users can read own terms acceptance." on public.terms_accepted;
drop policy if exists "Authenticated users can insert terms acceptance." on public.terms_accepted;

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
