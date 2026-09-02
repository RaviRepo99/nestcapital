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
  two_factor_enabled boolean not null default false,
  is_blocked boolean not null default false,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email_verified boolean not null default false;

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
  total_invested_by_referred numeric not null default 0,
  bonus_earned numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (referrer_id, referred_user_id)
);

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

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

drop policy if exists "profiles own or admin" on public.profiles;
create policy "profiles own or admin" on public.profiles for all using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists "wallets own or admin" on public.wallets;
create policy "wallets own or admin" on public.wallets for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
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
create policy "referrals involved or admin" on public.referrals for all using (referrer_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin()) with check (referrer_id = auth.uid() or public.is_admin());
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
