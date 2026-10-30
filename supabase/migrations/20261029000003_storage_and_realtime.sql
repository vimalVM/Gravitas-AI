-- =============================================================================
-- GRAVITAS AI - 003 Private image storage + Realtime configuration
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Private bucket for chat images and avatars.
-- Object layout:
--   conversations/<conversation_id>/<sender_id>/<client_id>.<ext>
--   avatars/<user_id>/<random>.<ext>
-- Uploads are performed by the backend only (after validating type, size and
-- authorization). Browsers receive short-lived signed URLs.
-- If you change MAX_UPLOAD_MB on the server, update file_size_limit too.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Defence in depth: authenticated clients may only read objects that belong
-- to a conversation they can access (or their own avatar / operators).
create or replace function public.can_read_storage_object(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
  v_uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if array_length(v_parts, 1) is null or array_length(v_parts, 1) < 2 or v_parts[2] !~ v_uuid_pattern then
    return false;
  end if;

  if v_parts[1] = 'conversations' then
    return public.can_access_conversation(v_parts[2]::uuid);
  elsif v_parts[1] = 'avatars' then
    return v_parts[2]::uuid = (select auth.uid()) or public.is_operator();
  end if;

  return false;
end;
$$;

revoke all on function public.can_read_storage_object(text) from public, anon;
grant execute on function public.can_read_storage_object(text) to authenticated, service_role;

drop policy if exists "Gravitas: participants can read chat attachments" on storage.objects;
create policy "Gravitas: participants can read chat attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments' and public.can_read_storage_object(name));

-- No insert/update/delete policies: browsers cannot write to the bucket.

-- -----------------------------------------------------------------------------
-- Realtime: publish row changes for the subscribed tables.
-- RLS policies above decide which subscribers receive each event.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Realtime Authorization for private channels "room:<conversation_id>".
-- Used for presence (online status) and the typing indicator. Only the
-- conversation owner and operators may join a room.
-- -----------------------------------------------------------------------------
create or replace function public.can_access_realtime_topic(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  if p_topic is null or p_topic not like 'room:%' then
    return false;
  end if;
  v_id := substr(p_topic, 6);
  if v_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  return public.can_access_conversation(v_id::uuid);
end;
$$;

revoke all on function public.can_access_realtime_topic(text) from public, anon;
grant execute on function public.can_access_realtime_topic(text) to authenticated, service_role;

drop policy if exists "Gravitas: room participants can receive" on realtime.messages;
create policy "Gravitas: room participants can receive"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and public.can_access_realtime_topic((select realtime.topic()))
  );

drop policy if exists "Gravitas: room participants can send" on realtime.messages;
create policy "Gravitas: room participants can send"
  on realtime.messages for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and public.can_access_realtime_topic((select realtime.topic()))
  );
