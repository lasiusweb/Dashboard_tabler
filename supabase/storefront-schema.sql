-- firstcrop.in Storefront — Supabase schema
-- Every table stores a single `data jsonb` column mirroring the local JSON files.
-- Anon reads everything; writes happen in Studio (service role, bypasses RLS).

-- =============================================================================
-- Collections
-- =============================================================================

create table storefront_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_offers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_reviews (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_faqs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_crops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_pincodes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table storefront_orders (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- =============================================================================
-- Singletons — one row per config key (home, checkout, support, cart, wishlist)
-- =============================================================================

create table storefront_config (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- =============================================================================
-- RLS — anon reads everything; no write policies (Studio uses service role)
-- =============================================================================

alter table storefront_categories enable row level security;
alter table storefront_products enable row level security;
alter table storefront_offers enable row level security;
alter table storefront_reviews enable row level security;
alter table storefront_faqs enable row level security;
alter table storefront_crops enable row level security;
alter table storefront_pincodes enable row level security;
alter table storefront_orders enable row level security;
alter table storefront_config enable row level security;

-- Public read policies
create policy "Public read" on storefront_categories for select using (true);
create policy "Public read" on storefront_products for select using (true);
create policy "Public read" on storefront_offers for select using (true);
create policy "Public read" on storefront_reviews for select using (true);
create policy "Public read" on storefront_faqs for select using (true);
create policy "Public read" on storefront_crops for select using (true);
create policy "Public read" on storefront_pincodes for select using (true);
create policy "Public read" on storefront_orders for select using (true);
create policy "Public read" on storefront_config for select using (true);

-- =============================================================================
-- Indexes
-- =============================================================================

create index idx_products_category on storefront_products using gin ((data -> 'categoryId'));
create index idx_products_season on storefront_products using gin ((data -> 'season'));
create index idx_reviews_product on storefront_reviews using gin ((data -> 'productId'));
create index idx_faqs_category on storefront_faqs using gin ((data -> 'category'));
create index idx_crops_season on storefront_crops using gin ((data -> 'season'));
create index idx_pincodes_zone on storefront_pincodes using gin ((data -> 'zone'));
create index idx_orders_status on storefront_orders using gin ((data -> 'status'));
