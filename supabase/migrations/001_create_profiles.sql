create type public.user_role as enum ('business', 'creator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  business_name text,
  business_category text check (
    business_category is null
    or business_category in ('Restaurant', 'Hotel', 'SaaS', 'Retail', 'Other')
  ),
  social_handle text,
  content_categories text[] not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint business_profile_fields check (
    role <> 'business'
    or (business_name is not null and business_category is not null)
  ),
  constraint creator_profile_fields check (
    role <> 'creator'
    or social_handle is not null
  )
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles
  for select
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile."
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile."
  on public.profiles
  for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    business_name,
    business_category,
    social_handle,
    content_categories
  )
  values (
    new.id,
    (new.raw_user_meta_data->>'role')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_category',
    new.raw_user_meta_data->>'social_handle',
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(new.raw_user_meta_data->'content_categories', '[]'::jsonb)
        )
      ),
      '{}'
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
