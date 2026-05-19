create table if not exists public.video_history (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists video_history_video_id_idx
  on public.video_history(video_id);

create index if not exists video_history_created_at_idx
  on public.video_history(created_at);

alter table public.video_history enable row level security;

drop policy if exists "Creators can read own video history." on public.video_history;
drop policy if exists "Businesses can read campaign video history." on public.video_history;

create policy "Creators can read own video history."
  on public.video_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.videos
      where videos.id = video_history.video_id
        and private.is_creator_owner(videos.creator_id)
    )
  );

create policy "Businesses can read campaign video history."
  on public.video_history
  for select
  to authenticated
  using (private.business_can_access_video(video_id));

create or replace function private.record_video_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.video_history (video_id, status, changed_by, note)
  values (
    new.id,
    new.status,
    null,
    'Status changed from ' || old.status || ' to ' || new.status
  );

  return new;
end;
$$;

drop trigger if exists on_video_status_change on public.videos;

create trigger on_video_status_change
  after update on public.videos
  for each row
  when (new.status is distinct from old.status)
  execute function private.record_video_status_change();
