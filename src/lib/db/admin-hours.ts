import "server-only";
import { getServerClient } from "@/lib/db/server";
import type { OpeningHoursValues } from "@/lib/validation/admin-hours";

export type OpeningHoursRow = {
  weekday: number; // 0 = Sunday ... 6 = Saturday
  isClosed: boolean;
  openTime: string; // "09:00" or ""
  closeTime: string; // "22:00" or ""
};

export type GetOpeningHoursResult =
  | { ok: true; rows: OpeningHoursRow[] }
  | { ok: false };

// The database gives "09:00:00". The time input needs "09:00".
function toInputTime(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

export async function getOpeningHours(): Promise<GetOpeningHoursResult> {
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from("opening_hours")
      .select("weekday, open_time, close_time, is_closed")
      .order("weekday", { ascending: true });

    if (error) {
      console.error("[admin] could not read opening_hours:", error.message);
      return { ok: false };
    }

    // Always return 7 rows (0 to 6). A missing day is shown as closed.
    const rows: OpeningHoursRow[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const row = (data ?? []).find((r) => r.weekday === weekday);
      return {
        weekday,
        isClosed: row ? row.is_closed : true,
        openTime: toInputTime(row?.open_time ?? null),
        closeTime: toInputTime(row?.close_time ?? null),
      };
    });

    return { ok: true, rows };
  } catch (err) {
    console.error("[admin] getOpeningHours failed:", err);
    return { ok: false };
  }
}

export async function updateOpeningHours(
  rows: OpeningHoursValues,
): Promise<{ ok: boolean }> {
  try {
    const supabase = getServerClient();

    const results = await Promise.all(
      rows.map((row) => {
        // A closed day: only change is_closed. The old times stay.
        const changes = row.isClosed
          ? { is_closed: true }
          : {
              is_closed: false,
              open_time: row.openTime,
              close_time: row.closeTime,
            };

        return supabase
          .from("opening_hours")
          .update(changes)
          .eq("weekday", row.weekday)
          .select("weekday");
      }),
    );

    for (const result of results) {
      if (result.error) {
        console.error(
          "[admin] could not update opening_hours:",
          result.error.message,
        );
        return { ok: false };
      }
      if (!result.data || result.data.length === 0) {
        console.error("[admin] opening_hours: a weekday row was not found");
        return { ok: false };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] updateOpeningHours crashed:", err);
    return { ok: false };
  }
}