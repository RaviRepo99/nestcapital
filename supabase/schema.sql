create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar text,
  referral_code text unique not null,
  referred_by text,
  registration_ip text,
  registration_device_id text,
  kyc_status text not null default 'unverified' check (kyc_status in ('unverified', 'pending', 'verified', 'rejected')),
  kyc_document_type text,
  kyc_document_number text,
  kyc_document_image text,
  kyc_document_image_front text,
  kyc_document_image_back text,
  two_factor_enabled boolean not null default false,
  is_blocked boolean not null default false,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists kyc_document_image_front text;
alter table public.profiles add column if not exists kyc_document_image_back text;

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available_balance numeric not null default 0,
  invested_balance numeric not null default 0,
  total_earnings numeric not null default 0,
  referral_earnings numeric not null default 0,
  total_deposited numeric not null default 0,
  total_withdrawn numeric not null default 0,
  pending_withdrawals numeric not null default 0,
  pending_deposits numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_plans (
  id text primary key,
  name text not null,
  minimum_amount numeric not null,
  maximum_amount numeric,
  return_rate numeric not null,
  duration_days integer not null,
  payout_frequency text not null default 'daily',
  status text not null default 'active',
  badge text,
  description text not null default '',
  is_popular boolean not null default false,
  total_investors integer not null default 0,
  total_invested_npr numeric not null default 0
);

insert into public.investment_plans (id, name, minimum_amount, maximum_amount, return_rate, duration_days, payout_frequency, status, badge, description, is_popular, total_investors, total_invested_npr)
values
  ('starter', 'Starter Plan', 5000, 14999, 5, 7, 'completion', 'active', 'Fast Return', 'Perfect for first-time investors looking for a 7-day package return.', false, 1420, 12500000),
  ('growth', 'Growth Plan', 15000, 24999, 20, 30, 'completion', 'active', 'Popular Choice', 'Balanced 30-day package with the configured return paid at maturity.', true, 3840, 68400000),
  ('premium', 'Premium Plan', 25000, 34999, 30, 45, 'completion', 'active', 'High Yield', 'Accelerated 45-day package with the configured return paid at maturity.', false, 2190, 74200000),
  ('elite', 'Elite Plan', 35000, 49999, 40, 60, 'completion', 'active', 'Executive', 'Dedicated 60-day package with the configured return paid at maturity.', false, 1650, 82000000),
  ('diamond', 'Diamond Plan', 50000, 94999, 60, 75, 'completion', 'active', 'VIP Wealth', 'Premier 75-day package with the configured return paid at maturity.', false, 980, 64500000),
  ('platinum', 'Platinum Plan', 95000, 1000000, 80, 90, 'completion', 'active', 'Maximum Return', 'Highest tier 90-day package with the configured return paid at maturity.', false, 620, 95000000)
on conflict (id) do nothing;

update public.investment_plans set payout_frequency = 'completion' where payout_frequency = 'daily';

create table if not exists public.investments (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.investment_plans(id),
  plan_name text not null,
  amount numeric not null,
  return_rate numeric not null,
  expected_return numeric not null,
  daily_return_amount numeric not null default 0,
  profit_earned_so_far numeric not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  next_payout_date timestamptz,
  duration_days integer not null,
  days_remaining integer not null default 0,
  progress_percentage integer not null default 0,
  status text not null default 'active',
  last_payout_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  payment_method text not null check (payment_method in ('esewa', 'khalti', 'fonepay')),
  payment_reference text not null,
  sender_name text,
  sender_account text,
  payment_proof text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.withdrawals (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null check (amount >= 1000),
  method text not null,
  account_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  direction text not null check (direction in ('in', 'out')),
  amount numeric not null,
  reference text not null,
  description text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id text primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text not null default '',
  referrer_reward numeric not null default 100 check (referrer_reward = 100),
  referred_reward numeric not null default 50 check (referred_reward = 50),
  investment_commission_rewarded boolean not null default false,
  total_invested_by_referred numeric not null default 0,
  bonus_earned numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'successful')),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  unique (referrer_id, referred_user_id)
);

alter table public.referrals add column if not exists referral_code text not null default '';
alter table public.referrals add column if not exists referrer_reward numeric not null default 100;
alter table public.referrals add column if not exists referred_reward numeric not null default 50;
alter table public.referrals add column if not exists investment_commission_rewarded boolean not null default false;
alter table public.referrals add column if not exists rewarded_at timestamptz;
update public.referrals set referrer_reward = 100, referred_reward = 50, status = case when status = 'active' then 'successful' else status end where referrer_reward is null or referred_reward is null or status = 'active';
alter table public.referrals drop constraint if exists referrals_status_check;
alter table public.referrals add constraint referrals_status_check check (status in ('pending', 'successful'));
create unique index if not exists referrals_referred_user_unique on public.referrals(referred_user_id);
create index if not exists referrals_status_idx on public.referrals(status);
create index if not exists referrals_code_idx on public.referrals(referral_code);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  message text not null,
  attachment text,
  status text not null default 'open',
  replies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets add column if not exists user_name text not null default '';
alter table public.support_tickets add column if not exists user_email text not null default '';

create table if not exists public.payment_settings (
  id text primary key check (id in ('esewa', 'khalti', 'fonepay')),
  title text not null,
  account_name text not null,
  account_id text not null,
  qr_image text,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.payment_settings (id, title, account_name, account_id)
values
  ('esewa', 'eSewa Merchant Wallet', 'CapitalNest Nepal Pvt. Ltd.', '9841234567'),
  ('khalti', 'Khalti Merchant ID', 'CapitalNest Nepal Pvt. Ltd.', '9801234567'),
  ('fonepay', 'Fonepay Merchant', 'CapitalNest Nepal Pvt. Ltd.', '9841234567')
on conflict (id) do nothing;

create index if not exists deposits_user_id_idx on public.deposits(user_id);
create index if not exists investments_user_id_idx on public.investments(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists profiles_registration_ip_idx on public.profiles(registration_ip);
create index if not exists profiles_registration_device_idx on public.profiles(registration_device_id);
drop index if exists profiles_registration_ip_unique;
drop index if exists profiles_registration_device_unique;

drop trigger if exists profiles_signup_referral_trigger on public.profiles;
drop function if exists public.apply_signup_referral();

create or replace function public.process_referral_reward(p_referred_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  referred_user profiles%rowtype;
  referrer profiles%rowtype;
  referral_row referrals%rowtype;
begin
  if auth.uid() is distinct from p_referred_user_id and auth.role() <> 'service_role' then
    raise exception 'You may only process your own referral reward';
  end if;

  select * into referred_user from public.profiles where id = p_referred_user_id for update;
  if not found then raise exception 'Referred user does not exist'; end if;
  if referred_user.referred_by is null or btrim(referred_user.referred_by) = '' then
    return jsonb_build_object('rewarded', false, 'reason', 'no_referrer');
  end if;

  select * into referrer from public.profiles
  where upper(referral_code) = upper(btrim(referred_user.referred_by))
    and id <> p_referred_user_id
  for update;
  if not found then return jsonb_build_object('rewarded', false, 'reason', 'invalid_referrer'); end if;

  select * into referral_row from public.referrals
  where referred_user_id = p_referred_user_id
  for update;
  if found and referral_row.status = 'successful' then
    return jsonb_build_object('rewarded', false, 'reason', 'already_rewarded', 'referral_id', referral_row.id);
  end if;

  if not found then
    insert into public.referrals (id, referrer_id, referred_user_id, referral_code, referrer_reward, referred_reward, bonus_earned, status, rewarded_at)
    values ('ref_' || replace(gen_random_uuid()::text, '-', ''), referrer.id, p_referred_user_id, upper(btrim(referred_user.referred_by)), 100, 50, 100, 'successful', now())
    returning * into referral_row;
  else
    if referral_row.referrer_id <> referrer.id then raise exception 'Referral already belongs to another referrer'; end if;
    update public.referrals set status = 'successful', referrer_reward = 100, referred_reward = 50, bonus_earned = 100, rewarded_at = now()
    where id = referral_row.id returning * into referral_row;
  end if;

  insert into public.wallets (user_id) values (referrer.id) on conflict (user_id) do nothing;
  update public.wallets set referral_earnings = referral_earnings + 100, updated_at = now() where user_id = referrer.id;
  insert into public.wallets (user_id) values (p_referred_user_id) on conflict (user_id) do nothing;
  update public.wallets set available_balance = available_balance + 50, updated_at = now() where user_id = p_referred_user_id;

  insert into public.transactions (id, user_id, type, direction, amount, reference, description, status)
  values
    ('tx_' || replace(gen_random_uuid()::text, '-', ''), referrer.id, 'referral_bonus', 'in', 100, 'REF-SIGNUP-' || upper(p_referred_user_id::text), 'NPR 100 referral bonus for inviting ' || referred_user.full_name, 'completed'),
    ('tx_' || replace(gen_random_uuid()::text, '-', ''), p_referred_user_id, 'referral_bonus', 'in', 50, 'WELCOME-REF-' || upper(p_referred_user_id::text), 'NPR 50 referral signup welcome bonus', 'completed');
  insert into public.notifications (id, user_id, title, message, type, read)
  values
    ('notif_' || replace(gen_random_uuid()::text, '-', ''), referrer.id, 'Referral Successful', 'You earned NPR 100 from your referral.', 'referral', false),
    ('notif_' || replace(gen_random_uuid()::text, '-', ''), p_referred_user_id, 'Welcome Bonus', 'You received NPR 50 referral bonus.', 'referral', false);
  return jsonb_build_object('rewarded', true, 'referral_id', referral_row.id, 'referrer_reward', 100, 'referred_reward', 50);
end;
$$;
revoke all on function public.process_referral_reward(uuid) from public;
grant execute on function public.process_referral_reward(uuid) to service_role;

create or replace function public.process_referral_investment_commission(p_referred_user_id uuid, p_investment_id text, p_investment_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  referred_user profiles%rowtype;
  referrer profiles%rowtype;
  referral_row referrals%rowtype;
  commission numeric;
begin
  if auth.uid() is distinct from p_referred_user_id and auth.role() <> 'service_role' then
    raise exception 'You may only process your own investment commission';
  end if;
  if p_investment_amount is null or p_investment_amount <= 0 then raise exception 'Investment amount must be positive'; end if;
  select * into referred_user from public.profiles where id = p_referred_user_id for update;
  if not found or referred_user.referred_by is null then return jsonb_build_object('commission_paid', false, 'reason', 'no_referrer'); end if;
  select * into referrer from public.profiles where upper(referral_code) = upper(btrim(referred_user.referred_by)) and id <> p_referred_user_id for update;
  if not found then return jsonb_build_object('commission_paid', false, 'reason', 'invalid_referrer'); end if;
  select * into referral_row from public.referrals where referred_user_id = p_referred_user_id for update;
  if not found or referral_row.referrer_id <> referrer.id then return jsonb_build_object('commission_paid', false, 'reason', 'referral_not_found'); end if;
  if referral_row.investment_commission_rewarded then
    return jsonb_build_object('commission_paid', false, 'reason', 'first_investment_already_rewarded');
  end if;

  commission := round(p_investment_amount * 0.05, 2);
  if exists (select 1 from public.transactions where user_id = referrer.id and reference = 'REF-INVEST-' || upper(p_investment_id)) then
    return jsonb_build_object('commission_paid', false, 'reason', 'already_processed');
  end if;
  insert into public.wallets (user_id) values (referrer.id) on conflict (user_id) do nothing;
  update public.wallets set referral_earnings = referral_earnings + commission, updated_at = now() where user_id = referrer.id;
  update public.referrals set total_invested_by_referred = total_invested_by_referred + p_investment_amount, bonus_earned = bonus_earned + commission, investment_commission_rewarded = true where id = referral_row.id;
  insert into public.transactions (id, user_id, type, direction, amount, reference, description, status)
  values ('tx_' || replace(gen_random_uuid()::text, '-', ''), referrer.id, 'referral_bonus', 'in', commission, 'REF-INVEST-' || upper(p_investment_id), '5% referral commission from ' || referred_user.full_name || '''s investment', 'completed');
  insert into public.notifications (id, user_id, title, message, type, read)
  values ('notif_' || replace(gen_random_uuid()::text, '-', ''), referrer.id, 'Referral Commission Earned', 'You earned NPR ' || commission::text || ' commission from your referral''s investment.', 'referral', false);
  return jsonb_build_object('commission_paid', true, 'commission_rate', 5, 'commission_amount', commission);
end;
$$;
revoke all on function public.process_referral_investment_commission(uuid, text, numeric) from public;
grant execute on function public.process_referral_investment_commission(uuid, text, numeric) to service_role;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.investment_plans enable row level security;
alter table public.investments enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.payment_settings enable row level security;
alter table public.app_state enable row level security;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      join pg_class c on c.oid = pr.prrelid
      where p.pubname = 'supabase_realtime' and c.relname = 'wallets'
    ) then alter publication supabase_realtime add table public.wallets; end if;
    if not exists (
      select 1 from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      join pg_class c on c.oid = pr.prrelid
      where p.pubname = 'supabase_realtime' and c.relname = 'referrals'
    ) then alter publication supabase_realtime add table public.referrals; end if;
    if not exists (
      select 1 from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      join pg_class c on c.oid = pr.prrelid
      where p.pubname = 'supabase_realtime' and c.relname = 'support_tickets'
    ) then alter publication supabase_realtime add table public.support_tickets; end if;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
    new.email_verified := old.email_verified;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_fields_trigger on public.profiles;
create trigger protect_profile_fields_trigger before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.ensure_unique_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is null or btrim(new.referral_code) = '' or exists (select 1 from public.profiles where referral_code = new.referral_code and id <> new.id) then
    loop
      new.referral_code := upper(left(regexp_replace(coalesce(new.full_name, 'USER'), '[^A-Za-z]', '', 'g'), 8)) || lpad((floor(random() * 900000) + 100000)::text, 6, '0');
      exit when not exists (select 1 from public.profiles where referral_code = new.referral_code and id <> new.id);
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists ensure_unique_referral_code_trigger on public.profiles;
create trigger ensure_unique_referral_code_trigger before insert or update of referral_code, full_name on public.profiles for each row execute function public.ensure_unique_referral_code();

do $$
declare
  profile_row record;
  old_code text;
  new_code text;
begin
  for profile_row in select id, referral_code from public.profiles where referral_code !~ '^[0-9]{6}$' loop
    old_code := profile_row.referral_code;
    loop
      new_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
      exit when not exists (select 1 from public.profiles where referral_code = new_code);
    end loop;
    update public.profiles set referred_by = new_code where upper(referred_by) = upper(old_code);
    update public.referrals set referral_code = new_code where upper(referral_code) = upper(old_code);
    update public.profiles set referral_code = new_code where id = profile_row.id;
  end loop;
end $$;

drop policy if exists "profiles own or admin" on public.profiles;
drop policy if exists "profiles readable own or admin" on public.profiles;
drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles readable own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists "wallets own or admin" on public.wallets;
drop policy if exists "wallets readable own or admin" on public.wallets;
drop policy if exists "wallets admin write" on public.wallets;
create policy "wallets readable own or admin" on public.wallets for select using (user_id = auth.uid() or public.is_admin());
create policy "wallets admin write" on public.wallets for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "plans readable" on public.investment_plans;
create policy "plans readable" on public.investment_plans for select using (true);
drop policy if exists "plans admin write" on public.investment_plans;
create policy "plans admin write" on public.investment_plans for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "investments own or admin" on public.investments;
create policy "investments own or admin" on public.investments for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "deposits own or admin" on public.deposits;
create policy "deposits own or admin" on public.deposits for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "withdrawals own or admin" on public.withdrawals;
create policy "withdrawals own or admin" on public.withdrawals for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "transactions own or admin" on public.transactions;
create policy "transactions own or admin" on public.transactions for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "referrals involved or admin" on public.referrals;
drop policy if exists "referrals admin write" on public.referrals;
create policy "referrals involved or admin" on public.referrals for select using (referrer_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());
create policy "referrals admin write" on public.referrals for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "notifications own or admin" on public.notifications;
create policy "notifications own or admin" on public.notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "tickets own or admin" on public.support_tickets;
create policy "tickets own or admin" on public.support_tickets for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "payment settings readable" on public.payment_settings;
create policy "payment settings readable" on public.payment_settings for select using (true);
drop policy if exists "payment settings admin write" on public.payment_settings;
create policy "payment settings admin write" on public.payment_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "app state admin only" on public.app_state;
create policy "app state admin only" on public.app_state for all using (public.is_admin()) with check (public.is_admin());
