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

// What a guest is allowed to see on the status page (no phone, no email)
export type BookingStatusInfo = {
  code: string;
  guest_name: string;
  party_size: number;
  starts_at: string;
  ends_at: string;
  status: string;
  can_cancel: boolean;
};

export type LookupBookingOutcome =
  | { ok: true; booking: BookingStatusInfo }
  | { ok: false; reason: "not_found" | "unknown" };

export type CancelBookingOutcome =
  | { ok: true; booking: { code: string; status: string; starts_at: string } }
  | {
      ok: false;
      reason: "not_found" | "not_cancellable" | "too_late" | "unknown";
    };

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

// Status page: find one booking by code + phone
export async function lookupBooking(
  code: string,
  phone: string
): Promise<LookupBookingOutcome> {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc("lookup_booking", {
    p_code: code,
    p_phone: phone,
  });

  if (error) {
    if (error.message.includes("not_found")) {
      return { ok: false, reason: "not_found" };
    }
    console.error("[db] lookupBooking failed:", error.message);
    return { ok: false, reason: "unknown" };
  }

  return { ok: true, booking: data as BookingStatusInfo };
}

// Status page: cancel one booking by code + phone
export async function cancelBooking(
  code: string,
  phone: string
): Promise<CancelBookingOutcome> {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_code: code,
    p_phone: phone,
  });

  if (error) {
    if (error.message.includes("not_found")) {
      return { ok: false, reason: "not_found" };
    }
    if (error.message.includes("not_cancellable")) {
      return { ok: false, reason: "not_cancellable" };
    }
    if (error.message.includes("too_late")) {
      return { ok: false, reason: "too_late" };
    }
    console.error("[db] cancelBooking failed:", error.message);
    return { ok: false, reason: "unknown" };
  }

  return {
    ok: true,
    booking: data as { code: string; status: string; starts_at: string },
  };
}