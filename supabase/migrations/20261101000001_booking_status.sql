-- Booking status page: look up and cancel a booking (guest side)
-- Both functions can be called only by the server (service_role).

-- How many hours before the booking a guest can still cancel online
-- (change the number 2 below if the restaurant wants another time)

-- 1) Look up one booking by code + phone
create or replace function public.lookup_booking(p_code text, p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text := upper(trim(coalesce(p_code, '')));
  v_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_booking public.bookings%rowtype;
begin
  -- Same error for every mistake, so nobody can guess codes
  if v_code = '' or length(v_digits) < 8 then
    raise exception 'not_found';
  end if;

  select b.* into v_booking
  from public.bookings b
  where upper(b.code) = v_code
    and right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 8) = right(v_digits, 8);

  if not found then
    raise exception 'not_found';
  end if;

  return json_build_object(
    'code', v_booking.code,
    'guest_name', v_booking.guest_name,
    'party_size', v_booking.party_size,
    'starts_at', v_booking.starts_at,
    'ends_at', v_booking.ends_at,
    'status', v_booking.status,
    'can_cancel',
      (v_booking.status in ('pending', 'confirmed')
       and v_booking.starts_at - interval '2 hours' > now())
  );
end;
$$;

-- 2) Cancel one booking by code + phone
create or replace function public.cancel_booking(p_code text, p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text := upper(trim(coalesce(p_code, '')));
  v_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_booking public.bookings%rowtype;
begin
  if v_code = '' or length(v_digits) < 8 then
    raise exception 'not_found';
  end if;

  -- "for update" locks the row, so two cancels cannot run at the same time
  select b.* into v_booking
  from public.bookings b
  where upper(b.code) = v_code
    and right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 8) = right(v_digits, 8)
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'not_cancellable';
  end if;

  if v_booking.starts_at - interval '2 hours' <= now() then
    raise exception 'too_late';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = v_booking.id;

  insert into public.booking_events (booking_id, action, actor)
  values (v_booking.id, 'cancelled', 'guest');

  return json_build_object(
    'code', v_booking.code,
    'status', 'cancelled',
    'starts_at', v_booking.starts_at
  );
end;
$$;

-- Only the server (service_role) can call them
revoke all on function public.lookup_booking(text, text) from public, anon, authenticated;
revoke all on function public.cancel_booking(text, text) from public, anon, authenticated;
grant execute on function public.lookup_booking(text, text) to service_role;
grant execute on function public.cancel_booking(text, text) to service_role;