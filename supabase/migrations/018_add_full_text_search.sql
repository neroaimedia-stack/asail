alter table public.campaigns
  add column if not exists fts tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(brief, '') || ' ' ||
      coalesce(instructions, '')
    )
  ) stored;

create index if not exists campaigns_fts_idx
  on public.campaigns using gin(fts);

alter table public.creators
  add column if not exists fts tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(handle, '') || ' ' ||
      coalesce(bio, '') || ' ' ||
      coalesce(array_to_string(categories, ' '), '')
    )
  ) stored;

create index if not exists creators_fts_idx
  on public.creators using gin(fts);

create or replace function public.search_campaigns(search_query text)
returns table (
  id uuid,
  title text,
  brief text,
  total_budget numeric,
  spent_budget numeric,
  cpm_rate numeric,
  business_name text,
  business_category text,
  business_logo_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.title,
    c.brief,
    c.total_budget,
    c.spent_budget,
    c.cpm_rate,
    b.business_name,
    b.category as business_category,
    b.logo_url as business_logo_url
  from public.campaigns c
  join public.businesses b on b.id = c.business_id
  where c.fts @@ plainto_tsquery('english', search_query)
    and c.status = 'active'
    and (c.expires_at is null or c.expires_at > now())
  order by ts_rank(c.fts, plainto_tsquery('english', search_query)) desc
  limit 20;
$$;

create or replace function public.search_creators(search_query text)
returns table (
  creator_id uuid,
  user_id uuid,
  full_name text,
  handle text,
  platform text,
  categories text[],
  verified boolean,
  total_views bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    cr.id as creator_id,
    cr.user_id,
    p.full_name,
    cr.handle,
    cr.platform,
    cr.categories,
    cr.verified,
    coalesce(sum(v.view_count), 0)::bigint as total_views
  from public.creators cr
  join public.profiles p on cr.user_id = p.id
  left join public.videos v
    on v.creator_id = cr.id
    and v.status = 'accepted'
  where cr.fts @@ plainto_tsquery('english', search_query)
    and cr.verified = true
  group by cr.id, p.full_name
  order by total_views desc
  limit 20;
$$;

revoke all on function public.search_campaigns(text) from public;
revoke all on function public.search_campaigns(text) from anon;
revoke all on function public.search_campaigns(text) from authenticated;
revoke all on function public.search_creators(text) from public;
revoke all on function public.search_creators(text) from anon;
revoke all on function public.search_creators(text) from authenticated;
grant execute on function public.search_campaigns(text) to service_role;
grant execute on function public.search_creators(text) to service_role;
