-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates products and orders tables for সৌখিন কুটিরশিল্প

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id          text        primary key,
  name        text        not null,
  name_bn     text        default '',
  category    text        not null,
  image_url   text        default '',
  price       numeric     not null default 0,
  badge       text        default '',
  description text        default '',
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for public shop query (active products ordered by sort_order)
create index if not exists products_active_sort on products (active, sort_order, created_at);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id            text        primary key,
  customer_name text        not null,
  phone         text        not null,
  email         text,
  address       text        not null,
  city          text        default '',
  items         jsonb       not null default '[]',
  payment       text        not null default 'cod',
  note          text,
  status        text        not null default 'Pending',
  total_bdt     numeric     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for admin orders query (newest first)
create index if not exists orders_created_at on orders (created_at desc);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- All access goes through service role key (server-side only).
-- Disable RLS so the service role key works without policy configuration.
alter table products disable row level security;
alter table orders   disable row level security;
