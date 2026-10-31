"use server";

import {
  createBookingSchema,
  slotsQuerySchema,
} from "@/lib/validation/booking";
import {
  createBooking,
  getAvailableSlots,
  type BookingResult,
} from "@/lib/db/bookings";
import {
  BOOKING_ERROR_MESSAGES,
  type BookingErrorReason,
} from "@/lib/booking-messages";

export type SlotsActionResult =
  | { ok: true; slots: string[] }
  | { ok: false; message: string };

export type CreateBookingActionResult =
  | { ok: true; booking: BookingResult }
  | { ok: false; reason: BookingErrorReason; message: string };

function fail(reason: BookingErrorReason): CreateBookingActionResult {
  return { ok: false, reason, message: BOOKING_ERROR_MESSAGES[reason] };
}

// Step 2 of the wizard: load free times for a date and party size
export async function getSlotsAction(
  date: string,
  partySize: number
): Promise<SlotsActionResult> {
  const parsed = slotsQuerySchema.safeParse({ date, partySize });
  if (!parsed.success) {
    return { ok: false, message: BOOKING_ERROR_MESSAGES.invalid_input };
  }

  try {
    const slots = await getAvailableSlots(
      parsed.data.date,
      parsed.data.partySize
    );
    return { ok: true, slots };
  } catch (error) {
    console.error(
      "[book] getSlotsAction failed:",
      error instanceof Error ? error.message : error
    );
    return { ok: false, message: BOOKING_ERROR_MESSAGES.unknown };
  }
}

// Step 4 of the wizard: create the booking
export async function createBookingAction(
  input: unknown
): Promise<CreateBookingActionResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_input");
  }

  try {
    const outcome = await createBooking(parsed.data);
    if (!outcome.ok) {
      return fail(outcome.reason);
    }
    return { ok: true, booking: outcome.booking };
  } catch (error) {
    console.error(
      "[book] createBookingAction failed:",
      error instanceof Error ? error.message : error
    );
    return fail("unknown");
  }
}