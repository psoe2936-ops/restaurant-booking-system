"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth/staff";
import {
  addBlockedDate,
  removeBlockedDate,
} from "@/lib/db/admin-blocked-dates";
import {
  addBlockedDateSchema,
  removeBlockedDateSchema,
} from "@/lib/validation/admin-blocked-dates";

export type BlockedDateActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function addBlockedDateAction(
  input: unknown,
): Promise<BlockedDateActionResult> {
  const admin = await getAdmin();
  if (!admin) {
    return { ok: false, message: "Only admins can block dates." };
  }

  const parsed = addBlockedDateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the date.",
    };
  }

  const outcome = await addBlockedDate(parsed.data.date, parsed.data.reason);
  if (!outcome.ok) {
    if (outcome.duplicate) {
      return { ok: false, message: "That date is already blocked." };
    }
    return { ok: false, message: "Could not block the date. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function removeBlockedDateAction(
  input: unknown,
): Promise<BlockedDateActionResult> {
  const admin = await getAdmin();
  if (!admin) {
    return { ok: false, message: "Only admins can unblock dates." };
  }

  const parsed = removeBlockedDateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the date.",
    };
  }

  const outcome = await removeBlockedDate(parsed.data.date);
  if (!outcome.ok) {
    return { ok: false, message: "Could not remove the blocked date. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
