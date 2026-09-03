-- Run these queries in Supabase SQL Editor.
-- Replace the email before running the diagnostic query.

-- 1) Check whether the Auth user exists and whether the address is confirmed.
select
  id,
  email,
  email_confirmed_at,
  confirmation_sent_at,
  last_sign_in_at,
  created_at
from auth.users
where lower(email) = lower('user@example.com');

-- 2) Check whether the application profile exists for the Auth user.
select p.id, p.email, p.email_verified, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('user@example.com');

-- 3) Optional: delete a stale/unconfirmed Auth user so registration can be
-- started again. This also removes its profile/wallet through foreign keys.
-- Run only after confirming the email address is correct.
-- delete from auth.users
-- where lower(email) = lower('user@example.com')
--   and email_confirmed_at is null;