-- =============================================================================
-- GRAVITAS AI - 001 Core schema
-- Tables, constraints, indexes, triggers and trusted (service-role only)
-- database functions. Safe to re-run: every statement is idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per Supabase Auth user
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  avatar_path  text check (avatar_path is null or char_length(avatar_path) <= 512),
  role         text not null default 'user' check (role in ('user', 'ai_operator')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- conversations: a user's conversation with Gravitas AI about one project
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  title                    text not null default 'Gravitas AI' check (char_length(title) between 1 and 120),
  project_name             text not null check (char_length(project_name) between 1 and 120),
  project_code             text not null check (char_length(project_code) between 1 and 40),
  project_description      text check (project_description is null or char_length(project_description) <= 500),
  status                   text not null default 'in_progress' check (status in ('in_progress', 'on_hold', 'completed')),
  last_message_at          timestamptz,
  last_message_preview     text,
  last_message_type        text check (last_message_type is null or last_message_type in ('text', 'image')),
  last_message_sender_role text check (last_message_sender_role is null or last_message_sender_role in ('user', 'ai_operator')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint conversations_user_project_key unique (user_id, project_code)
);

create index if not exists conversations_last_message_idx
  on public.conversations (last_message_at desc nulls last);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- messages
--   sender_id is NULL only for the automated welcome message.
--   sender_role is always derived server-side from the authenticated profile.
--   client_id makes message creation idempotent (safe retries).
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  sender_role     text not null check (sender_role in ('user', 'ai_operator')),
  client_id       uuid not null default gen_random_uuid(),
  content         text check (content is null or char_length(content) <= 4000),
  message_type    text not null default 'text' check (message_type in ('text', 'image')),
  attachment_path text check (attachment_path is null or char_length(attachment_path) <= 512),
  attachment_mime text check (attachment_mime is null or attachment_mime in ('image/jpeg', 'image/png', 'image/webp')),
  attachment_size integer check (attachment_size is null or attachment_size > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint messages_conversation_client_key unique (conversation_id, client_id),
  constraint messages_has_body check (
    nullif(btrim(coalesce(content, '')), '') is not null or attachment_path is not null
  ),
  constraint messages_type_matches_attachment check (
    (message_type = 'image') = (attachment_path is not null)
  )
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc, id desc);
create index if not exists messages_conversation_role_created_idx
  on public.messages (conversation_id, sender_role, created_at);
create index if not exists messages_sender_idx on public.messages (sender_id);

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- conversation_reads: per-account read position, used for unread counts
-- -----------------------------------------------------------------------------
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_reads_user_idx on public.conversation_reads (user_id);

drop trigger if exists conversation_reads_set_updated_at on public.conversation_reads;
create trigger conversation_reads_set_updated_at
  before update on public.conversation_reads
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- New auth users always receive the plain 'user' role.
-- Sign-up metadata is only used for the display name - never for the role.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name',
                                  new.raw_user_meta_data ->> 'full_name', '')), '');
  if v_name is null then
    v_name := coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Gravitas user');
  end if;

  insert into public.profiles (id, display_name, role)
  values (new.id, left(v_name, 80), 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts that existed before this migration ran.
insert into public.profiles (id, display_name, role)
select u.id,
       left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
                     nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
                     'Gravitas user'), 80),
       'user'
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Role protection: only trusted database roles may grant or change a role.
-- (postgres = SQL editor, service_role = backend/seed script.)
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role <> 'user' then
    raise exception 'Only trusted administrators can create operator profiles'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'Changing a profile role is not permitted'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- Keep the conversation summary (inbox preview) in sync with new messages.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at          = new.created_at,
         last_message_preview     = left(nullif(btrim(coalesce(new.content, '')), ''), 160),
         last_message_type        = new.message_type,
         last_message_sender_role = new.sender_role
   where id = new.conversation_id
     and (last_message_at is null or last_message_at <= new.created_at);
  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- =============================================================================
-- Trusted functions (called by the Express backend with the service-role key).
-- They accept the acting user's id as a parameter, so they must NEVER be
-- executable by browser clients (anon / authenticated).
-- =============================================================================

-- Get or create a user's conversation for a project; inserts the welcome
-- message exactly once (only when the conversation is first created).
create or replace function public.ensure_user_conversation(
  p_user_id uuid,
  p_title text,
  p_project_name text,
  p_project_code text,
  p_project_description text,
  p_status text,
  p_welcome text
)
returns public.conversations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.conversations;
begin
  insert into public.conversations (user_id, title, project_name, project_code, project_description, status)
  values (p_user_id, p_title, p_project_name, p_project_code, p_project_description, p_status)
  on conflict (user_id, project_code) do nothing
  returning * into v_conversation;

  if v_conversation.id is not null then
    if nullif(btrim(coalesce(p_welcome, '')), '') is not null then
      insert into public.messages (conversation_id, sender_id, sender_role, content, message_type)
      values (v_conversation.id, null, 'ai_operator', btrim(p_welcome), 'text');
    end if;
    select * into v_conversation from public.conversations where id = v_conversation.id;
  else
    select * into v_conversation
      from public.conversations
     where user_id = p_user_id and project_code = p_project_code;
  end if;

  return v_conversation;
end;
$$;

-- Conversations visible to a viewer, with unread counts.
--   ai_operator -> every conversation (support inbox)
--   user        -> only their own conversations
create or replace function public.list_conversations(
  p_viewer uuid,
  p_search text default null,
  p_limit integer default 100
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  project_name text,
  project_code text,
  project_description text,
  status text,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_type text,
  last_message_sender_role text,
  created_at timestamptz,
  updated_at timestamptz,
  user_display_name text,
  user_avatar_path text,
  unread_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_role text;
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
begin
  select pr.role into v_role from public.profiles pr where pr.id = p_viewer;
  if v_role is null then
    return;
  end if;

  return query
  select c.id, c.user_id, c.title, c.project_name, c.project_code, c.project_description,
         c.status, c.last_message_at, c.last_message_preview, c.last_message_type,
         c.last_message_sender_role, c.created_at, c.updated_at,
         owner.display_name, owner.avatar_path,
         (select count(*)::integer
            from public.messages m
           where m.conversation_id = c.id
             and m.sender_role <> v_role
             and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz))
    from public.conversations c
    join public.profiles owner on owner.id = c.user_id
    left join public.conversation_reads r on r.conversation_id = c.id and r.user_id = p_viewer
   where (v_role = 'ai_operator' or c.user_id = p_viewer)
     and (v_search is null
          or owner.display_name ilike '%' || v_search || '%'
          or c.project_name ilike '%' || v_search || '%'
          or c.project_code ilike '%' || v_search || '%')
   order by c.last_message_at desc nulls last, c.created_at desc
   limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

-- Move a viewer's read position forward (never backwards). Uses the database
-- clock so it compares correctly with message timestamps.
create or replace function public.mark_conversation_read(p_conversation_id uuid, p_user_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_read_at timestamptz;
begin
  insert into public.conversation_reads as cr (conversation_id, user_id, last_read_at)
  values (p_conversation_id, p_user_id, now())
  on conflict (conversation_id, user_id)
  do update set last_read_at = greatest(cr.last_read_at, excluded.last_read_at)
  returning cr.last_read_at into v_read_at;
  return v_read_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Operator role administration (run from the Supabase SQL editor only).
-- -----------------------------------------------------------------------------
create or replace function public.assign_operator_role(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user auth.users;
  v_profile public.profiles;
begin
  select * into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user.id is null then
    raise exception 'No Supabase Auth account exists with email %', p_email;
  end if;

  insert into public.profiles (id, display_name, role)
  values (v_user.id, left(coalesce(nullif(split_part(coalesce(v_user.email, ''), '@', 1), ''), 'Operator'), 80), 'ai_operator')
  on conflict (id) do update set role = 'ai_operator'
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.revoke_operator_role(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  update public.profiles p
     set role = 'user'
    from auth.users u
   where u.id = p.id and lower(u.email) = lower(btrim(p_email))
  returning p.* into v_profile;

  if v_profile.id is null then
    raise exception 'No profile found for email %', p_email;
  end if;
  return v_profile;
end;
$$;

-- Lock the trusted functions down to the service role / SQL editor.
revoke all on function public.ensure_user_conversation(uuid, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.list_conversations(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.mark_conversation_read(uuid, uuid) from public, anon, authenticated;
revoke all on function public.assign_operator_role(text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_operator_role(text) from public, anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_new_message() from public, anon, authenticated;

grant execute on function public.ensure_user_conversation(uuid, text, text, text, text, text, text) to service_role;
grant execute on function public.list_conversations(uuid, text, integer) to service_role;
grant execute on function public.mark_conversation_read(uuid, uuid) to service_role;
