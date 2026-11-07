"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth/staff";
import { updateOpeningHours } from "@/lib/db/admin-hours";
import { getRestaurantSettings } from "@/lib/db/admin-settings";
import {
  DAY_NAMES,
  openingHoursSchema,
  toMinutes,
} from "@/lib/validation/admin-hours";

export type UpdateHoursActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOpeningHoursAction(
  input: unknown,
): Promise<UpdateHoursActionResult> {
  // 1. Only admin can do this. Always check on the server.
  const admin = await getAdmin();
  if (!admin) {
    return { ok: false, message: "Only admins can change opening hours." };
  }

  // 2. Check the input.
  const parsed = openingHoursSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the times.",
    };
  }

  // 3. An open day must be long enough for at least one slot.
  const settings = await getRestaurantSettings();
  if (!settings.ok) {
    return { ok: false, message: "Could not save. Please try again." };
  }

  for (const row of parsed.data) {
    if (row.isClosed) continue;
    const openMinutes = toMinutes(row.closeTime) - toMinutes(row.openTime);
    if (openMinutes < settings.settings.slotLengthMin) {
      return {
        ok: false,
        message: `${DAY_NAMES[row.weekday]}: the open time is shorter than one slot (${settings.settings.slotLengthMin} minutes), so nobody could book.`,
      };
    }
  }

  // 4. Save.
  const outcome = await updateOpeningHours(parsed.data);
  if (!outcome.ok) {
    return { ok: false, message: "Could not save. Please try again." };
  }

  // 5. Refresh the pages that use these values.
  revalidatePath("/admin", "layout");
  revalidatePath("/book");
  revalidatePath("/contact");
  revalidatePath("/");
  return { ok: true };
}