create or replace view public.earnings_summary
with (security_invoker = true)
as
select
  v.creator_id,
  v.id as video_id,
  v.campaign_id,
  v.view_count,
  v.payout_amount,
  v.payout_status,
  v.status as video_status,
  v.platform,
  c.cpm_rate,
  c.title as campaign_title,
  b.business_name,
  v.submitted_at
from public.videos v
join public.campaigns c on v.campaign_id = c.id
join public.businesses b on c.business_id = b.id
where v.status = 'accepted';

create or replace view public.business_spend_summary
with (security_invoker = true)
as
select
  c.business_id,
  c.id as campaign_id,
  c.title as campaign_title,
  c.total_budget,
  c.spent_budget,
  c.cpm_rate,
  coalesce(sum(v.payout_amount), 0) as total_paid_out,
  coalesce(sum(v.view_count), 0) as total_views,
  count(v.id) as total_videos
from public.campaigns c
left join public.videos v
  on v.campaign_id = c.id
  and v.status = 'accepted'
group by c.id, c.business_id, c.title, c.total_budget, c.spent_budget, c.cpm_rate;

grant select on public.earnings_summary to authenticated;
grant select on public.business_spend_summary to authenticated;
