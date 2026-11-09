"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth/staff";
import {
  addAdminTable,
  changeAdminTableSeats,
  setAdminTableActive,
} from "@/lib/db/admin-tables";
import {
  addTableSchema,
  changeTableSeatsSchema,
  setTableActiveSchema,
} from "@/lib/validation/admin-tables";

export type TablesActionResult =
  | { ok: true; warningCount?: number; biggestPartySize?: number }
  | { ok: false; message: string };

export async function addTableAction(input: unknown): Promise<TablesActionResult> {
  try {
    const admin = await getAdmin();
    if (!admin) return { ok: false, message: "Only admins can add tables." };

    const parsed = addTableSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Please check the table details.",
      };
    }

    const outcome = await addAdminTable(parsed.data.label, parsed.data.capacity);
    if (!outcome.ok) {
      if (outcome.reason === "duplicate") {
        return { ok: false, message: "That table label is already in use." };
      }
      return { ok: false, message: "Could not add the table. Please try again." };
    }

    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    console.error("[admin] add table action failed:", err);
    return { ok: false, message: "Could not add the table. Please try again." };
  }
}

export async function changeTableSeatsAction(
  input: unknown,
): Promise<TablesActionResult> {
  try {
    const admin = await getAdmin();
    if (!admin) return { ok: false, message: "Only admins can change table seats." };

    const parsed = changeTableSeatsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Please check the table details.",
      };
    }

    const outcome = await changeAdminTableSeats(
      parsed.data.tableId,
      parsed.data.capacity,
    );
    if (!outcome.ok) {
      return {
        ok: false,
        message:
          outcome.reason === "not_found"
            ? "That table could not be found."
            : "Could not change the table seats. Please try again.",
      };
    }

    revalidatePath("/admin", "layout");
    return { ok: true, biggestPartySize: outcome.biggestOpenFuturePartySize };
  } catch (err) {
    console.error("[admin] change table seats action failed:", err);
    return {
      ok: false,
      message: "Could not change the table seats. Please try again.",
    };
  }
}

export async function setTableActiveAction(
  input: unknown,
): Promise<TablesActionResult> {
  try {
    const admin = await getAdmin();
    if (!admin) return { ok: false, message: "Only admins can change table status." };

    const parsed = setTableActiveSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Please choose a valid table.",
      };
    }

    const outcome = await setAdminTableActive(
      parsed.data.tableId,
      parsed.data.isActive,
    );
    if (!outcome.ok) {
      if (outcome.reason === "last_active") {
        return { ok: false, message: "You cannot turn off the last active table." };
      }
      return {
        ok: false,
        message:
          outcome.reason === "not_found"
            ? "That table could not be found."
            : "Could not change the table status. Please try again.",
      };
    }

    revalidatePath("/admin", "layout");
    return { ok: true, warningCount: outcome.openFutureBookingCount };
  } catch (err) {
    console.error("[admin] change table status action failed:", err);
    return {
      ok: false,
      message: "Could not change the table status. Please try again.",
    };
  }
}
