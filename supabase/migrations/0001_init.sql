-- Amrah Studio schema.
-- Every table is scoped to the owning brand account and protected by RLS.

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  brand_name text,
  tier text not null default 'free'
    check (tier in ('free', 'starter', 'pro', 'scale', 'enterprise')),
  -- Enterprise buyers can forbid processing outside US/EU regions.
  routing_policy text not null default 'any'
    check (routing_policy in ('any', 'western-only')),
  credits_remaining integer not null default 20,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Brand kit ------------------------------------------------------------------
-- Set once, enforced on every generation. This is what keeps a catalogue
-- looking like one photoshoot instead of a thousand unrelated ones.

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lighting_style text,
  background_style text,
  color_grade text,
  -- Locked model identity, reused across SKUs to hold the catalogue together.
  model_reference_url text,
  model_body_profile text,
  created_at timestamptz not null default now()
);

alter table public.brand_kits enable row level security;

create policy "Owner full access" on public.brand_kits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shoots ---------------------------------------------------------------------
-- One uploaded garment becomes one shoot, which fans out into bundle assets.

create table public.shoots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_kit_id uuid references public.brand_kits(id) on delete set null,
  sku text,
  garment_front_url text not null,
  garment_back_url text,
  garment_category text not null default 'one-piece'
    check (garment_category in ('top', 'bottom', 'one-piece')),
  audience text not null default 'adult' check (audience in ('adult', 'kids')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'complete', 'failed')),
  -- Sum of provider costs, recorded so unit margin is observable per shoot.
  cost_usd numeric(10, 4) not null default 0,
  error text,
  created_at timestamptz not null default now()
);

alter table public.shoots enable row level security;

create policy "Owner full access" on public.shoots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index shoots_user_created_idx on public.shoots (user_id, created_at desc);

-- Assets ---------------------------------------------------------------------

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references public.shoots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  url text not null,
  kind text not null default 'image' check (kind in ('image', 'video')),
  provider_id text,
  cost_usd numeric(10, 4) not null default 0,
  -- Populated by the compliance validator; null means not yet checked.
  compliance jsonb,
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "Owner full access" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index assets_shoot_idx on public.assets (shoot_id);
