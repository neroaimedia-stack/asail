create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  last_message_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create unique index if not exists conversations_unique
  on public.conversations(
    business_id,
    creator_id,
    coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists conversations_business_id_idx
  on public.conversations(business_id, last_message_at desc);

create index if not exists conversations_creator_id_idx
  on public.conversations(creator_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages(conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function private.is_conversation_participant(
  target_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations
    where conversations.id = target_conversation_id
      and (
        private.is_business_owner(conversations.business_id)
        or private.is_creator_owner(conversations.creator_id)
      )
  );
$$;

create policy "Users can read conversations they participate in."
  on public.conversations
  for select
  to authenticated
  using (
    private.is_business_owner(business_id)
    or private.is_creator_owner(creator_id)
  );

create policy "Users can read messages in own conversations."
  on public.messages
  for select
  to authenticated
  using (private.is_conversation_participant(conversation_id));

create policy "Users can insert messages in own conversations."
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_participant(conversation_id)
  );

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
