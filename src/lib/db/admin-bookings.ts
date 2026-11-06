import "server-only";
import { getServerClient } from "@/lib/db/server";

export type AdminBooking = {
  id: string;
  code: string;
  guest_name: string;
  phone: string;
  party_size: number;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  table_label: string | null;
};

export type TodaysBookingsResult =
  | { ok: true; bookings: AdminBooking[]; dateLabel: string }
  | { ok: false };

const RESTAURANT_TZ = "Asia/Yangon";

// Yangon is always UTC+6:30 (no daylight saving), so this is safe.
function getTodayRangeUtc() {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TZ,
  }).format(new Date()); // for example "2026-11-05"

  const start = new Date(`${ymd}T00:00:00+06:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESTAURANT_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return { start: start.toISOString(), end: end.toISOString(), dateLabel };
}

export async function getTodaysBookings(): Promise<TodaysBookingsResult> {
  const { start, end, dateLabel } = getTodayRangeUtc();

  try {
    const supabase = getServerClient();

    const { data: rows, error } = await supabase
      .from("bookings")
      .select(
        "id, code, guest_name, phone, party_size, starts_at, ends_at, status, notes, table_id",
      )
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[admin] could not read today's bookings:", error.message);
      return { ok: false };
    }

    const { data: tables, error: tablesError } = await supabase
      .from("dining_tables")
      .select("id, label");

    if (tablesError) {
      console.error("[admin] could not read dining_tables:", tablesError.message);
      return { ok: false };
    }

    const labelById = new Map<string, string>(
      (tables ?? []).map((t) => [t.id as string, t.label as string]),
    );

    const bookings: AdminBooking[] = (rows ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      guest_name: row.guest_name,
      phone: row.phone,
      party_size: row.party_size,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      status: row.status,
      notes: row.notes,
      table_label: labelById.get(row.table_id) ?? null,
    }));

    return { ok: true, bookings, dateLabel };
  } catch (err) {
    console.error("[admin] getTodaysBookings failed:", err);
    return { ok: false };
  }
}