create extension if not exists pgcrypto;

create table if not exists public.birthday_hero_orders (
  id uuid primary key default gen_random_uuid(),
  package_id text not null check (package_id in ('standard', 'deluxe', 'family')),
  stripe_session_id text not null,
  stripe_payment_link_id text not null,
  stripe_payment_status text not null default 'paid',
  purchaser_name text not null,
  purchaser_email text not null,
  child_first_name text not null,
  child_age integer not null check (child_age between 3 and 10),
  appearance text not null,
  theme_id text not null check (theme_id in ('dinosaur', 'space', 'mystery')),
  interests text not null,
  favourite_colour text not null,
  pet text,
  family_members text,
  details_to_avoid text,
  dedication text not null,
  permission_confirmed boolean not null default false,
  privacy_acknowledged boolean not null default false,
  marketing_consent boolean not null default false,
  photo_path text,
  photo_mime text,
  status text not null default 'received' check (status in ('received', 'in_progress', 'proofing', 'delivered', 'cancelled')),
  submitted_at timestamptz not null default now()
);

create unique index if not exists birthday_hero_orders_stripe_session_unique
  on public.birthday_hero_orders (stripe_session_id);

alter table public.birthday_hero_orders enable row level security;

-- The Data API is opt-in for this project. Only the server-only service role
-- may reach the order table; browser roles receive no table privileges.
revoke all on table public.birthday_hero_orders from anon, authenticated;
grant select, insert, update, delete on table public.birthday_hero_orders to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-photos', 'order-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No public policies are created. The website writes through its server-only
-- Route Handler using the Supabase service role; staff access stays in Supabase.
