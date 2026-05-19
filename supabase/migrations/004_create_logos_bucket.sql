insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Business users can upload own logos." on storage.objects;
drop policy if exists "Business users can update own logos." on storage.objects;
drop policy if exists "Business users can read logos." on storage.objects;

create policy "Business users can upload own logos."
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Business users can update own logos."
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
