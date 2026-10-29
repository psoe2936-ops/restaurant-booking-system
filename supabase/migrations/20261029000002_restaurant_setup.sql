-- One row only: the restaurant's settings
create table restaurant_settings (
  id int primary key default 1 check (id = 1),
  name text not null,
  phone text,
  address text,
  timezone text not null default 'Asia/Yangon',
  slot_length_min int not null default 90 check (slot_length_min > 0),
  max_party_size int not null default 10 check (max_party_size > 0),
  booking_window_days int not null default 30 check (booking_window_days > 0),
  updated_at timestamptz not null default now()
);

-- One row per weekday (0 = Sunday ... 6 = Saturday)
create table opening_hours (
  weekday int primary key check (weekday between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  check (
    is_closed
    or (open_time is not null and close_time is not null and close_time > open_time)
  )
);

-- Days with no bookings (holidays, private events)
create table blocked_dates (
  date date primary key,
  reason text
);

-- The tables guests can sit at
create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  capacity int not null check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Security: Row Level Security ON for every table
alter table restaurant_settings enable row level security;
alter table opening_hours enable row level security;
alter table blocked_dates enable row level security;
alter table dining_tables enable row level security;

-- Guests may read settings and opening hours (public info only)
create policy "Public can read settings"
  on restaurant_settings for select using (true);

create policy "Public can read opening hours"
  on opening_hours for select using (true);

-- blocked_dates and dining_tables have NO public policy on purpose.
-- Only our server can read them.