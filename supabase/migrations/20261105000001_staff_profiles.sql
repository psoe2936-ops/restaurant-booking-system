-- Staff profiles: who can use the admin dashboard, and with which role.
-- The Clerk user id is the link between Clerk (login) and our database (role).

create table public.staff_profiles (
  clerk_user_id text primary key,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- RLS on and no public policy: only the server (service role) can read or write.
alter table public.staff_profiles enable row level security;

revoke all on public.staff_profiles from public, anon, authenticated;
grant select, insert, update, delete on public.staff_profiles to service_role;