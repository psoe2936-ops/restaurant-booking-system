create or replace function create_booking(
  p_guest_name text,
  p_phone text,
  p_email text,
  p_party_size int,
  p_starts_at timestamptz,
  p_notes text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_settings restaurant_settings%rowtype;
  v_hours opening_hours%rowtype;
  v_name text := trim(coalesce(p_guest_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_email text := nullif(trim(coalesce(p_email, '')), '');
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
  v_end timestamptz;
  v_local timestamp;
  v_date date;
  v_active int;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_table record;
  v_label text;
  v_booking_id uuid;
  v_done boolean := false;
  i int;
  k int;
begin
  select * into v_settings from restaurant_settings where id = 1;
  if not found then
    raise exception 'not_configured';
  end if;

  -- Basic input checks (the server checks again with Zod)
  if v_name = '' or length(v_name) > 100
     or v_phone = '' or length(v_phone) > 30
     or length(coalesce(v_email, '')) > 200
     or length(coalesce(v_notes, '')) > 500 then
    raise exception 'invalid_input';
  end if;

  if p_party_size is null or p_party_size < 1
     or p_party_size > v_settings.max_party_size then
    raise exception 'invalid_party_size';
  end if;

  -- Time rules
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'in_the_past';
  end if;

  if p_starts_at > now() + make_interval(days => v_settings.booking_window_days) then
    raise exception 'too_far_ahead';
  end if;

  v_end := p_starts_at + make_interval(mins => v_settings.slot_length_min);
  v_local := p_starts_at at time zone v_settings.timezone;
  v_date := v_local::date;

  if exists (select 1 from blocked_dates bd where bd.date = v_date) then
    raise exception 'blocked_date';
  end if;

  select * into v_hours
  from opening_hours oh
  where oh.weekday = extract(dow from v_local)::int;

  if not found or v_hours.is_closed then
    raise exception 'closed';
  end if;

  if v_local < v_date + v_hours.open_time
     or v_local + make_interval(mins => v_settings.slot_length_min)
        > v_date + v_hours.close_time then
    raise exception 'outside_hours';
  end if;

  -- Same phone: at most 3 active bookings at once
  select count(*) into v_active
  from bookings b
  where b.phone = v_phone
    and b.status in ('pending', 'confirmed')
    and b.ends_at > now();

  if v_active >= 3 then
    raise exception 'too_many_bookings';
  end if;

  -- Try the smallest fitting tables first
  for v_table in
    select dt.id, dt.label
    from dining_tables dt
    where dt.is_active
      and dt.capacity >= p_party_size
      and not exists (
        select 1 from bookings b
        where b.table_id = dt.id
          and b.status in ('pending', 'confirmed', 'seated')
          and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_starts_at, v_end)
      )
    order by dt.capacity, dt.label
  loop
    for k in 1..5 loop
      -- Random booking code, for example RB-7K3Q9
      v_code := 'RB-';
      for i in 1..5 loop
        v_code := v_code || substr(
          v_alphabet,
          (('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 2))::bit(8)::int % 31) + 1,
          1
        );
      end loop;

      begin
        insert into bookings
          (code, table_id, guest_name, phone, email, party_size, starts_at, ends_at, notes)
        values
          (v_code, v_table.id, v_name, v_phone, v_email, p_party_size, p_starts_at, v_end, v_notes)
        returning id into v_booking_id;

        v_done := true;
        v_label := v_table.label;
        exit;
      exception
        when unique_violation then
          null;   -- the code already exists, make a new one
        when exclusion_violation then
          exit;   -- someone just took this table, try the next table
      end;
    end loop;

    exit when v_done;
  end loop;

  if not v_done then
    raise exception 'no_table_available';
  end if;

  insert into booking_events (booking_id, action, actor)
  values (v_booking_id, 'created', 'guest');

  return jsonb_build_object(
    'booking_id', v_booking_id,
    'code', v_code,
    'table_label', v_label,
    'starts_at', p_starts_at,
    'ends_at', v_end
  );
end;
$$;

-- Only our server (service role) may call this function.
-- Guests in the browser can never call it directly.
revoke all on function create_booking(text, text, text, int, timestamptz, text)
  from public, anon, authenticated;
grant execute on function create_booking(text, text, text, int, timestamptz, text)
  to service_role;