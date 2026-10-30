-- =============================================================================
-- GRAVITAS AI - seed / administration snippets
--
-- Accounts themselves are created through Supabase Auth (Dashboard ->
-- Authentication -> Users -> "Add user", the /register page, or
-- `npm run seed:demo`). Passwords are hashed by Supabase Auth and are never
-- stored in these tables.
--
-- Run the statements you need in the Supabase SQL editor (it runs as the
-- trusted `postgres` role). Replace the example e-mail addresses first.
-- =============================================================================

-- 1) Grant the AI operator role to an EXISTING Auth account you created for
--    the operator. This is the only supported way to create an operator.
-- select * from public.assign_operator_role('operator@example.com');

-- 2) Check the roles that are currently assigned.
-- select u.email, p.display_name, p.role, p.created_at
--   from public.profiles p
--   join auth.users u on u.id = p.id
--  order by p.created_at;

-- 3) Remove the operator role again (the account becomes a normal user).
-- select * from public.revoke_operator_role('operator@example.com');

-- 4) Inspect conversations and message counts.
-- select c.id, p.display_name, c.project_name, c.last_message_at,
--        (select count(*) from public.messages m where m.conversation_id = c.id) as messages
--   from public.conversations c
--   join public.profiles p on p.id = c.user_id
--  order by c.last_message_at desc nulls last;
