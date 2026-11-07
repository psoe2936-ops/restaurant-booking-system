"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth/staff";
import { updateRestaurantSettings } from "@/lib/db/admin-settings";
import {
  restaurantSettingsSchema,
  SETTINGS_FIELD_HELP,
} from "@/lib/validation/admin-settings";

export type UpdateSettingsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateSettingsAction(
  input: unknown,
): Promise<UpdateSettingsActionResult> {
  // 1. Only admin can do this. Always check on the server.
  const admin = await getAdmin();
  if (!admin) {
    return { ok: false, message: "Only admins can change settings." };
  }

  // 2. Check the input.
  const parsed = restaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      ok: false,
      message: SETTINGS_FIELD_HELP[field] ?? "Please check the values.",
    };
  }

  // 3. Save.
  const outcome = await updateRestaurantSettings(parsed.data);
  if (!outcome.ok) {
    return { ok: false, message: "Could not save. Please try again." };
  }

  // 4. Refresh the pages that use these values.
  revalidatePath("/admin", "layout");
  revalidatePath("/book");
  revalidatePath("/contact");
  revalidatePath("/");
  return { ok: true };
}