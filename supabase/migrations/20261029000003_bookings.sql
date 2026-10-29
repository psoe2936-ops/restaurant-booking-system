-- Lets one index combine "same table" (=) with "overlapping time" (&&)
create extension if not exists btree_gist;

create table bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  table_id uuid not null references dining_tables(id),
  guest_name text not null check (length(trim(guest_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  email text,
  party_size int not null check (party_size > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),

  -- The important rule: the same table cannot have overlapping bookings,
  -- but only while the booking is active.
  constraint bookings_no_overlap exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed', 'seated'))
);

create index bookings_starts_at_idx on bookings (starts_at);
create index bookings_phone_idx on bookings (phone);

-- Audit log: who changed what, and when
create table booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  action text not null,
  actor text not null,
  created_at timestamptz not null default now()
);

create index booking_events_booking_idx on booking_events (booking_id);

-- Security: Row Level Security ON, and NO public policy.
-- Guests cannot read or write these tables directly.
-- Only our server (service role key) can.
alter table bookings enable row level security;
alter table booking_events enable row level security;