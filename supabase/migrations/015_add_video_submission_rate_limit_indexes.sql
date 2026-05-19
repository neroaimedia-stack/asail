create index if not exists videos_creator_campaign_status_idx
  on public.videos(creator_id, campaign_id, status);

create index if not exists videos_creator_submitted_at_idx
  on public.videos(creator_id, submitted_at desc);

create index if not exists videos_creator_campaign_submitted_at_idx
  on public.videos(creator_id, campaign_id, submitted_at desc);
