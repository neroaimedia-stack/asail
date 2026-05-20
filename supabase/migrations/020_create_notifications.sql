create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'video_submitted',
      'video_accepted',
      'video_rejected',
      'dispute_opened',
      'dispute_resolved',
      'campaign_expiring',
      'campaign_expired',
      'invitation_received',
      'invitation_accepted',
      'new_message',
      'payout_sent'
    )
  ),
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read own notifications."
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update own notifications."
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_link
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke execute on function public.create_notification(uuid, text, text, text, text) from public;
revoke execute on function public.create_notification(uuid, text, text, text, text) from anon;
revoke execute on function public.create_notification(uuid, text, text, text, text) from authenticated;
grant execute on function public.create_notification(uuid, text, text, text, text) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
