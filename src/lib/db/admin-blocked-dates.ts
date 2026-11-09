import "server-only";
import { getServerClient } from "@/lib/db/server";

export type BlockedDate = {
  date: string;
  reason: string | null;
  openBookingCount: number;
};

export type GetBlockedDatesResult =
  | { ok: true; dates: BlockedDate[] }
  | { ok: false };

export type AddBlockedDateResult =
  | { ok: true }
  | { ok: false; duplicate?: boolean };

const OPEN_BOOKING_STATUSES = ["pending", "confirmed", "seated"];

function getDayRangeUtc(date: string) {
  const start = new Date(`${date}T00:00:00+06:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function countOpenBookings(date: string): Promise<number | null> {
  try {
    const supabase = getServerClient();
    const { start, end } = getDayRangeUtc(date);
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", OPEN_BOOKING_STATUSES)
      .gte("starts_at", start)
      .lt("starts_at", end);

    if (error) {
      console.error("[admin] could not count bookings for blocked date:", error.message);
      return null;
    }

    return count ?? 0;
  } catch (err) {
    console.error("[admin] countOpenBookings failed:", err);
    return null;
  }
}

export async function getBlockedDates(): Promise<GetBlockedDatesResult> {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("date, reason")
      .order("date", { ascending: true });

    if (error) {
      console.error("[admin] could not read blocked_dates:", error.message);
      return { ok: false };
    }

    const dates: BlockedDate[] = [];
    for (const row of data ?? []) {
      const openBookingCount = await countOpenBookings(row.date);
      if (openBookingCount === null) return { ok: false };
      dates.push({
        date: row.date,
        reason: row.reason,
        openBookingCount,
      });
    }

    return { ok: true, dates };
  } catch (err) {
    console.error("[admin] getBlockedDates failed:", err);
    return { ok: false };
  }
}

export async function addBlockedDate(
  date: string,
  reason: string | null,
): Promise<AddBlockedDateResult> {
  try {
    const supabase = getServerClient();
    const { error } = await supabase
      .from("blocked_dates")
      .insert({ date, reason });

    if (error) {
      if (error.code === "23505") return { ok: false, duplicate: true };
      console.error("[admin] could not add blocked_dates row:", error.message);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] addBlockedDate failed:", err);
    return { ok: false };
  }
}

export async function removeBlockedDate(date: string): Promise<{ ok: boolean }> {
  try {
    const supabase = getServerClient();
    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("date", date);

    if (error) {
      console.error("[admin] could not remove blocked_dates row:", error.message);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] removeBlockedDate failed:", err);
    return { ok: false };
  }
}
