-- Affiliate / referral system for Birthday Hero Book.
-- Run in the Supabase SQL editor AFTER supabase/schema.sql.
-- Access model matches the orders table: server-only (service_role); Row Level
-- Security is enabled with no anon/authenticated policies, so browser roles get
-- nothing. The partner dashboard reads data server-side with the service role,
-- scoped to the logged-in partner.

create extension if not exists pgcrypto;

-- Marketing partners who refer customers.
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  code text not null,                              -- referral slug used in /r/<code>
  name text not null,
  email text not null,
  auth_user_id uuid unique,                        -- links to the Supabase Auth user for the partner dashboard
  commission_rate numeric(5, 4) not null default 0.20 check (commission_rate >= 0 and commission_rate <= 1),
  status text not null default 'active' check (status in ('active', 'paused')),
  notes text,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so /r/SARAH and /r/sarah resolve to one partner.
create unique index if not exists affiliates_code_lower_unique on public.affiliates (lower(code));

-- Referral link clicks — the "referrals" (traffic) metric.
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  created_at timestamptz not null default now(),
  landing_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_hash text,                                    -- salted hash only; never the raw IP
  user_agent text
);
create index if not exists affiliate_clicks_affiliate_idx on public.affiliate_clicks (affiliate_id, created_at);

-- Attribution + commission on each paid order.
alter table public.birthday_hero_orders
  add column if not exists affiliate_id uuid references public.affiliates (id) on delete set null,
  add column if not exists commission_amount numeric(10, 2),
  add column if not exists commission_status text not null default 'none'
    check (commission_status in ('none', 'pending', 'approved', 'paid', 'reversed'));
create index if not exists birthday_hero_orders_affiliate_idx on public.birthday_hero_orders (affiliate_id);

-- Server-only access, consistent with the orders table.
alter table public.affiliates enable row level security;
alter table public.affiliate_clicks enable row level security;

revoke all on table public.affiliates from anon, authenticated;
revoke all on table public.affiliate_clicks from anon, authenticated;
grant select, insert, update, delete on table public.affiliates to service_role;
grant select, insert, update, delete on table public.affiliate_clicks to service_role;

-- No public policies are created; only the server-only service role may read or
-- write these tables. Partner dashboards are rendered server-side.
