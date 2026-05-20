alter table public.creators
  add column if not exists verified boolean not null default false;

drop view if exists public.creator_leaderboard;

create view public.creator_leaderboard as
select
  cr.id as creator_id,
  cr.user_id,
  p.full_name,
  cr.handle,
  cr.platform,
  cr.categories,
  cr.verified,
  coalesce(sum(v.view_count), 0) as total_views,
  coalesce(sum(v.payout_amount), 0) as total_earned,
  count(v.id) as total_videos_accepted,
  coalesce(avg(v.view_count), 0) as avg_views_per_video
from public.creators cr
join public.profiles p on cr.user_id = p.id
left join public.videos v
  on v.creator_id = cr.id
  and v.status = 'accepted'
group by cr.id, cr.user_id, p.full_name, cr.handle, cr.platform, cr.categories, cr.verified
order by total_views desc;

revoke all on public.creator_leaderboard from anon;
revoke all on public.creator_leaderboard from public;
grant select on public.creator_leaderboard to authenticated;
