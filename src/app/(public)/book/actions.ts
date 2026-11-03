"use server";

import { after } from "next/server";
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
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email/send";
import { buildBookingConfirmationEmail } from "@/lib/email/booking-confirmation";

export type SlotsActionResult =
  | { ok: true; slots: string[] }
  | { ok: false; message: string };

export type CreateBookingActionResult =
  | { ok: true; booking: BookingResult }
  | {
      ok: false;
      reason: BookingErrorReason | "captcha_failed";
      message: string;
    };

function fail(reason: BookingErrorReason): CreateBookingActionResult {
  return { ok: false, reason, message: BOOKING_ERROR_MESSAGES[reason] };
}

function failCaptcha(): CreateBookingActionResult {
  return {
    ok: false,
    reason: "captcha_failed",
    message: "We could not check that you are a real person. Please try again.",
  };
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

// Step 4 of the wizard: check the spam token, create the booking,
// then send the confirmation email (only if the guest typed an email)
export async function createBookingAction(
  input: unknown,
  turnstileToken: string
): Promise<CreateBookingActionResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_input");
  }

  // Spam check: ask Cloudflare if the token is real
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.ok) {
    return failCaptcha();
  }

  try {
    const outcome = await createBooking(parsed.data);
    if (!outcome.ok) {
      return fail(outcome.reason);
    }

    const guestEmail = parsed.data.email;
    if (guestEmail) {
      const booking = outcome.booking;
      const guestName = parsed.data.guestName;
      const partySize = parsed.data.partySize;

      // Runs after the answer is sent. A failed email never breaks the booking.
      after(async () => {
        try {
          const message = buildBookingConfirmationEmail({
            guestName,
            code: booking.code,
            startsAt: booking.starts_at,
            partySize,
          });
          await sendEmail({ to: guestEmail, ...message });
        } catch (error) {
          console.error(
            "[book] confirmation email failed:",
            error instanceof Error ? error.message : error
          );
        }
      });
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