-- Staff changes the status of a booking.
-- The rules live here, in the database. The server cannot skip them.
-- Allowed moves:
--   pending   -> confirmed, cancelled
--   confirmed -> seated, cancelled, no_show
--   seated    -> completed

create or replace function public.admin_update_booking_status(
  p_booking_id text,
  p_new_status text,
  p_actor text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id public.bookings.id%type;
  v_code text;
  v_old text;
begin
  if p_new_status is null
     or p_new_status not in ('confirmed', 'cancelled', 'seated', 'completed', 'no_show') then
    raise exception 'invalid_status';
  end if;

  if p_actor is null or length(trim(p_actor)) = 0 then
    raise exception 'invalid_input';
  end if;

  -- Lock the row, so two staff cannot change it at the same time.
  select id, code, status
    into v_id, v_code, v_old
  from public.bookings
  where id::text = p_booking_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if not (
    (v_old = 'pending'   and p_new_status in ('confirmed', 'cancelled'))
    or (v_old = 'confirmed' and p_new_status in ('seated', 'cancelled', 'no_show'))
    or (v_old = 'seated'    and p_new_status = 'completed')
  ) then
    raise exception 'invalid_transition';
  end if;

  update public.bookings
  set status = p_new_status
  where id = v_id;

  insert into public.booking_events (booking_id, action, actor)
  values (v_id, p_new_status, p_actor);

  return json_build_object(
    'booking_id', v_id,
    'code', v_code,
    'old_status', v_old,
    'status', p_new_status
  );
end;
$$;

-- Only the server (service_role) can call it.
revoke all on function public.admin_update_booking_status(text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_update_booking_status(text, text, text)
  to service_role;