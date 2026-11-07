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

export type NeedsAttentionBooking = AdminBooking & {
  reason: "overdue" | "upcoming_pending";
};

export type NeedsAttentionResult =
  | { ok: true; bookings: NeedsAttentionBooking[] }
  | { ok: false };

const RESTAURANT_TZ = "Asia/Yangon";

const BOOKING_COLUMNS =
  "id, code, guest_name, phone, party_size, starts_at, ends_at, status, notes, table_id";

// Yangon is always UTC+6:30 (no daylight saving), so this is safe.
function getTodayRangeUtc() {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TZ,
  }).format(new Date()); // for example "2026-11-07"

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

// Reads the table labels (T1, T2...) and returns a map: id -> label.
async function loadTableLabels(
  supabase: ReturnType<typeof getServerClient>,
): Promise<Map<string, string> | null> {
  const { data: tables, error } = await supabase
    .from("dining_tables")
    .select("id, label");

  if (error) {
    console.error("[admin] could not read dining_tables:", error.message);
    return null;
  }

  return new Map<string, string>(
    (tables ?? []).map((t) => [t.id as string, t.label as string]),
  );
}

export async function getTodaysBookings(): Promise<TodaysBookingsResult> {
  const { start, end, dateLabel } = getTodayRangeUtc();

  try {
    const supabase = getServerClient();

    const { data: rows, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[admin] could not read today's bookings:", error.message);
      return { ok: false };
    }

    const labelById = await loadTableLabels(supabase);
    if (!labelById) return { ok: false };

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

// Open bookings that are NOT in today's list but still need an answer:
//  - overdue: the day is over, but the booking is still pending/confirmed/seated
//  - upcoming_pending: a later day, and staff have not confirmed or cancelled yet
export async function getNeedsAttention(): Promise<NeedsAttentionResult> {
  const { start, end } = getTodayRangeUtc();

  try {
    const supabase = getServerClient();

    const { data: rows, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .in("status", ["pending", "confirmed", "seated"])
      .or(`starts_at.lt.${start},and(status.eq.pending,starts_at.gte.${end})`)
      .order("starts_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("[admin] could not read needs-attention:", error.message);
      return { ok: false };
    }

    const labelById = await loadTableLabels(supabase);
    if (!labelById) return { ok: false };

    const bookings: NeedsAttentionBooking[] = (rows ?? []).map((row) => ({
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
      reason: row.starts_at < start ? "overdue" : "upcoming_pending",
    }));

    return { ok: true, bookings };
  } catch (err) {
    console.error("[admin] getNeedsAttention failed:", err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------
// Change the status of one booking (the rules live in the database)
// ---------------------------------------------------------------

export type NewBookingStatus =
  | "confirmed"
  | "cancelled"
  | "seated"
  | "completed"
  | "no_show";

export type UpdateBookingStatusOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_found"
        | "invalid_transition"
        | "invalid_status"
        | "invalid_input"
        | "unknown";
    };

const UPDATE_ERROR_WORDS = [
  "not_found",
  "invalid_transition",
  "invalid_status",
  "invalid_input",
] as const;

export async function updateBookingStatus(
  bookingId: string,
  newStatus: NewBookingStatus,
  actor: string,
): Promise<UpdateBookingStatusOutcome> {
  try {
    const supabase = getServerClient();

    const { error } = await supabase.rpc("admin_update_booking_status", {
      p_booking_id: bookingId,
      p_new_status: newStatus,
      p_actor: actor,
    });

    if (error) {
      const word = UPDATE_ERROR_WORDS.find((w) => error.message.includes(w));
      if (word) return { ok: false, reason: word };

      console.error("[admin] update booking status failed:", error.message);
      return { ok: false, reason: "unknown" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] updateBookingStatus crashed:", err);
    return { ok: false, reason: "unknown" };
  }
}