-- How often a slot starts (every 30 minutes by default)
alter table restaurant_settings
  add column slot_interval_min int not null default 30
  check (slot_interval_min > 0);

create or replace function get_available_slots(p_date date, p_party_size int)
returns table (slot_start timestamptz)
language plpgsql
stable
set search_path = public
as $$
declare
  v_settings restaurant_settings%rowtype;
  v_hours opening_hours%rowtype;
begin
  select * into v_settings from restaurant_settings where id = 1;
  if not found then
    return;
  end if;

  if p_date is null
     or p_party_size is null
     or p_party_size < 1
     or p_party_size > v_settings.max_party_size then
    return;
  end if;

  if exists (select 1 from blocked_dates bd where bd.date = p_date) then
    return;
  end if;

  select * into v_hours
  from opening_hours oh
  where oh.weekday = extract(dow from p_date)::int;

  if not found or v_hours.is_closed then
    return;
  end if;

  return query
  select c.t
  from (
    select (g.local_start at time zone v_settings.timezone) as t
    from generate_series(
      p_date + v_hours.open_time,
      p_date + v_hours.close_time - make_interval(mins => v_settings.slot_length_min),
      make_interval(mins => v_settings.slot_interval_min)
    ) as g(local_start)
  ) c
  where c.t > now()
    and c.t <= now() + make_interval(days => v_settings.booking_window_days)
    and exists (
      select 1
      from dining_tables dt
      where dt.is_active
        and dt.capacity >= p_party_size
        and not exists (
          select 1
          from bookings b
          where b.table_id = dt.id
            and b.status in ('pending', 'confirmed', 'seated')
            and tstzrange(b.starts_at, b.ends_at)
                && tstzrange(c.t, c.t + make_interval(mins => v_settings.slot_length_min))
        )
    )
  order by c.t;
end;
$$;

-- Only our server may call it (guests go through the server)
revoke all on function get_available_slots(date, int)
  from public, anon, authenticated;
grant execute on function get_available_slots(date, int) to service_role;