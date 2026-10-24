-- Menu categories
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_my text not null,
  name_en text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Menu items
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  name_my text not null,
  name_en text not null,
  description text,
  price integer not null check (price >= 0), -- whole kyats
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index menu_items_category_idx on menu_items(category_id);

-- Security: Row Level Security ON for every table
alter table menu_categories enable row level security;
alter table menu_items enable row level security;

-- Guests can only READ visible menu data
create policy "Public can read visible categories"
  on menu_categories for select
  using (is_visible = true);

create policy "Public can read menu items"
  on menu_items for select
  using (true);