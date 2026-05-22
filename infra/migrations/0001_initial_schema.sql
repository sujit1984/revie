create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'provider_enum') then
    create type provider_enum as enum ('google', 'apple', 'linkedin');
  end if;
  if not exists (select 1 from pg_type where typname = 'node_type_enum') then
    create type node_type_enum as enum ('category', 'brand', 'product_type', 'model');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_status_enum') then
    create type review_status_enum as enum ('published', 'flagged', 'hidden', 'pending');
  end if;
  if not exists (select 1 from pg_type where typname = 'node_status_enum') then
    create type node_status_enum as enum ('active', 'pending_moderation', 'rejected');
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  provider provider_enum not null,
  provider_user_id text not null,
  email citext not null,
  email_verified boolean not null default false,
  display_name text,
  avatar_url text,
  trust_score numeric(5,2) not null default 50.00,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id),
  unique (email)
);

create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_fingerprint_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, device_fingerprint_hash)
);

create table if not exists taxonomy_nodes (
  id uuid primary key default gen_random_uuid(),
  node_type node_type_enum not null,
  name text not null,
  normalized_name text not null,
  parent_id uuid references taxonomy_nodes(id) on delete restrict,
  depth smallint not null check (depth between 0 and 3),
  status node_status_enum not null default 'active',
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, normalized_name, node_type)
);

create index if not exists idx_taxonomy_parent on taxonomy_nodes(parent_id);
create index if not exists idx_taxonomy_name_trgm on taxonomy_nodes using gin (normalized_name gin_trgm_ops);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  model_node_id uuid not null references taxonomy_nodes(id) on delete restrict,
  canonical_name text not null,
  normalized_canonical_name text not null,
  model_code text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_node_id, normalized_canonical_name, model_code)
);

create index if not exists idx_products_name_trgm on products using gin (normalized_canonical_name gin_trgm_ops);
create index if not exists idx_products_model_node on products(model_node_id);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) >= 20),
  status review_status_enum not null default 'published',
  risk_score numeric(5,2) not null default 0.00,
  ip_hash text,
  device_fingerprint_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_reviews_product_status_created on reviews(product_id, status, created_at desc);
create index if not exists idx_reviews_user_created on reviews(user_id, created_at desc);
create index if not exists idx_reviews_body_trgm on reviews using gin (body gin_trgm_ops);

create table if not exists review_votes (
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  is_helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table if not exists fraud_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  review_id uuid references reviews(id) on delete cascade,
  signal_type text not null,
  signal_score numeric(5,2) not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_fraud_user_created on fraud_signals(user_id, created_at desc);
create index if not exists idx_fraud_review_created on fraud_signals(review_id, created_at desc);

create table if not exists product_rating_summary (
  product_id uuid primary key references products(id) on delete cascade,
  review_count integer not null default 0,
  avg_rating numeric(4,3) not null default 0.000,
  bayesian_rating numeric(4,3) not null default 0.000,
  star_1_count integer not null default 0,
  star_2_count integer not null default 0,
  star_3_count integer not null default 0,
  star_4_count integer not null default 0,
  star_5_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  target_review_id uuid references reviews(id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_taxonomy_nodes_updated_at on taxonomy_nodes;
create trigger trg_taxonomy_nodes_updated_at before update on taxonomy_nodes
for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
for each row execute function set_updated_at();

drop trigger if exists trg_reviews_updated_at on reviews;
create trigger trg_reviews_updated_at before update on reviews
for each row execute function set_updated_at();
