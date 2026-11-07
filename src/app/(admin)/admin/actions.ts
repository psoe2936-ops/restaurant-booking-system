"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth/staff";
import { updateBookingStatus } from "@/lib/db/admin-bookings";

const updateStatusSchema = z.object({
  bookingId: z.string().min(1).max(64),
  newStatus: z.enum(["confirmed", "cancelled", "seated", "completed", "no_show"]),
});

export type UpdateStatusActionResult =
  | { ok: true }
  | { ok: false; message: string };

const MESSAGES: Record<string, string> = {
  not_found: "This booking was not found. Please refresh the page.",
  invalid_transition:
    "This change is not allowed now. The booking may have changed. Please refresh the page.",
  invalid_status: "This status is not valid.",
  invalid_input: "Something is wrong with the request.",
  unknown: "Something went wrong. Please try again.",
};

export async function updateBookingStatusAction(
  input: unknown,
): Promise<UpdateStatusActionResult> {
  // 1. Only admin or staff can do this. Always check on the server.
  const staff = await getStaff();
  if (!staff) {
    return { ok: false, message: "You do not have access." };
  }

  // 2. Check the input.
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: MESSAGES.invalid_input };
  }

  // 3. Ask the database to make the change (it checks the rules).
  const outcome = await updateBookingStatus(
    parsed.data.bookingId,
    parsed.data.newStatus,
    `staff:${staff.userId}`,
  );

  if (!outcome.ok) {
    return { ok: false, message: MESSAGES[outcome.reason] ?? MESSAGES.unknown };
  }

  // 4. Refresh the dashboard data.
  revalidatePath("/admin");
  return { ok: true };
}