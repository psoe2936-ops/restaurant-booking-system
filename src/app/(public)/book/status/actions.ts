"use server";

import { bookingLookupSchema } from "@/lib/validation/booking-status";
import {
  cancelBooking,
  lookupBooking,
  type BookingStatusInfo,
} from "@/lib/db/bookings";
import { verifyTurnstile } from "@/lib/turnstile";

const NOT_FOUND_MESSAGE =
  "We could not find this booking. Please check your code and phone number.";
const CAPTCHA_MESSAGE =
  "We could not check that you are a real person. Please try again.";
const UNKNOWN_MESSAGE = "Something went wrong. Please try again.";

export type LookupActionResult =
  | { ok: true; booking: BookingStatusInfo }
  | { ok: false; message: string };

export type CancelActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function lookupBookingAction(
  code: string,
  phone: string,
  turnstileToken: string
): Promise<LookupActionResult> {
  const parsed = bookingLookupSchema.safeParse({ code, phone });
  if (!parsed.success) {
    // Same message as "not found", so nobody can learn anything
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.ok) {
    return { ok: false, message: CAPTCHA_MESSAGE };
  }

  const outcome = await lookupBooking(parsed.data.code, parsed.data.phone);
  if (!outcome.ok) {
    return {
      ok: false,
      message: outcome.reason === "not_found" ? NOT_FOUND_MESSAGE : UNKNOWN_MESSAGE,
    };
  }

  return { ok: true, booking: outcome.booking };
}

export async function cancelBookingAction(
  code: string,
  phone: string,
  turnstileToken: string
): Promise<CancelActionResult> {
  const parsed = bookingLookupSchema.safeParse({ code, phone });
  if (!parsed.success) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.ok) {
    return { ok: false, message: CAPTCHA_MESSAGE };
  }

  const outcome = await cancelBooking(parsed.data.code, parsed.data.phone);
  if (outcome.ok) {
    return { ok: true, message: "Your booking is cancelled." };
  }

  switch (outcome.reason) {
    case "not_found":
      return { ok: false, message: NOT_FOUND_MESSAGE };
    case "not_cancellable":
      return {
        ok: false,
        message: "This booking cannot be cancelled online.",
      };
    case "too_late":
      return {
        ok: false,
        message:
          "It is too late to cancel online. Please call the restaurant.",
      };
    default:
      return { ok: false, message: UNKNOWN_MESSAGE };
  }
}