import "server-only";
import { getServerClient } from "./server";
import type { BookingErrorReason } from "@/lib/booking-messages";

export type BookingResult = {
  booking_id: string;
  code: string;
  table_label: string;
  starts_at: string;
  ends_at: string;
};

export type CreateBookingOutcome =
  | { ok: true; booking: BookingResult }
  | { ok: false; reason: BookingErrorReason };

const KNOWN_REASONS: BookingErrorReason[] = [
  "not_configured",
  "invalid_input",
  "invalid_party_size",
  "in_the_past",
  "too_far_ahead",
  "blocked_date",
  "closed",
  "outside_hours",
  "too_many_bookings",
  "no_table_available",
];

function toReason(message: string): BookingErrorReason {
  const found = KNOWN_REASONS.find((reason) => message.includes(reason));
  return found ?? "unknown";
}

// date is the restaurant's local date, for example "2026-11-02"
export async function getAvailableSlots(
  date: string,
  partySize: number
): Promise<string[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_date: date,
    p_party_size: partySize,
  });

  if (error) {
    throw new Error(`Could not load time slots: ${error.message}`);
  }

  return (data ?? []).map((row: { slot_start: string }) => row.slot_start);
}

export async function createBooking(input: {
  guestName: string;
  phone: string;
  email?: string;
  partySize: number;
  startsAt: string;
  notes?: string;
}): Promise<CreateBookingOutcome> {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_guest_name: input.guestName,
    p_phone: input.phone,
    p_email: input.email || null,
    p_party_size: input.partySize,
    p_starts_at: input.startsAt,
    p_notes: input.notes || null,
  });

  if (error) {
    return { ok: false, reason: toReason(error.message) };
  }

  return { ok: true, booking: data as BookingResult };
}