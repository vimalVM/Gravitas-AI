-- =============================================================================
-- GRAVITAS AI - 002 Row Level Security
--
-- Browser clients (anon / authenticated roles) get READ-ONLY access, limited
-- to their own data. Operators can read the support inbox. All writes go
-- through the Express backend, which verifies the JWT and checks
-- authorization explicitly before using the service-role key.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Authorization helpers used by policies (security definer avoids recursive
-- RLS evaluation on profiles/conversations).
-- -----------------------------------------------------------------------------
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where id = (select auth.uid()) and role = 'ai_operator'
  );
$$;

create or replace function public.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
     where c.id = p_conversation_id
       and (c.user_id = (select auth.uid()) or public.is_operator())
  );
$$;

revoke all on function public.is_operator() from public, anon;
revoke all on function public.can_access_conversation(uuid) from public, anon;
grant execute on function public.is_operator() to authenticated, service_role;
grant execute on function public.can_access_conversation(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.conversation_reads enable row level security;

-- Clients never write directly; the anon role cannot read anything.
revoke all on public.profiles, public.conversations, public.messages, public.conversation_reads from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.profiles, public.conversations, public.messages, public.conversation_reads
  from authenticated;
grant select on public.profiles, public.conversations, public.messages, public.conversation_reads to authenticated;
grant all on public.profiles, public.conversations, public.messages, public.conversation_reads to service_role;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
drop policy if exists "Profiles: read own profile" on public.profiles;
create policy "Profiles: read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Profiles: operators read all profiles" on public.profiles;
create policy "Profiles: operators read all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_operator()));

-- -----------------------------------------------------------------------------
-- conversations
-- -----------------------------------------------------------------------------
drop policy if exists "Conversations: owner or operator can read" on public.conversations;
create policy "Conversations: owner or operator can read"
  on public.conversations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_operator()));

-- -----------------------------------------------------------------------------
-- messages (also governs which Realtime postgres_changes events are delivered)
-- -----------------------------------------------------------------------------
drop policy if exists "Messages: conversation participants can read" on public.messages;
create policy "Messages: conversation participants can read"
  on public.messages for select to authenticated
  using (public.can_access_conversation(conversation_id));

-- -----------------------------------------------------------------------------
-- conversation_reads
-- -----------------------------------------------------------------------------
drop policy if exists "Reads: read own read state" on public.conversation_reads;
create policy "Reads: read own read state"
  on public.conversation_reads for select to authenticated
  using (user_id = (select auth.uid()));
