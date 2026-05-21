create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  category text not null check (
    category in ('account', 'campaign', 'payment', 'verification', 'dispute', 'bug', 'other')
  ),
  message text not null,
  attach_url text,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  admin_reply text,
  replied_at timestamp with time zone,
  replied_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists support_tickets_user_id_idx
  on public.support_tickets(user_id, created_at desc);

create index if not exists support_tickets_status_created_at_idx
  on public.support_tickets(status, created_at desc);

alter table public.support_tickets enable row level security;

create policy "Users can create own support tickets."
  on public.support_tickets
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can read own support tickets."
  on public.support_tickets
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can read all support tickets."
  on public.support_tickets
  for select
  to authenticated
  using (private.current_user_is_admin());

create policy "Admins can update all support tickets."
  on public.support_tickets
  for update
  to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());
