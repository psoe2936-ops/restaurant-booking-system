import "server-only";
import { getServerClient } from "@/lib/db/server";

const OPEN_BOOKING_STATUSES = ["pending", "confirmed", "seated"];
const BOOKING_PAGE_SIZE = 1000;

export type AdminTable = {
  id: string;
  label: string;
  capacity: number;
  isActive: boolean;
  openFutureBookingCount: number;
  biggestOpenFuturePartySize: number;
};

export type TablesWarningData = {
  maxPartySize: number;
  biggestActiveTableCapacity: number;
};

export type GetAdminTablesResult =
  | { ok: true; tables: AdminTable[]; warningData: TablesWarningData }
  | { ok: false };

export type AddAdminTableResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "unknown" };

export type ChangeAdminTableSeatsResult =
  | { ok: true; biggestOpenFuturePartySize: number }
  | { ok: false; reason: "not_found" | "unknown" };

export type SetAdminTableActiveResult =
  | { ok: true; openFutureBookingCount: number }
  | { ok: false; reason: "last_active" | "not_found" | "unknown" };

type OpenFutureBooking = {
  table_id: string;
  party_size: number;
};

async function getOpenFutureBookings(): Promise<OpenFutureBooking[] | null> {
  try {
    const supabase = getServerClient();
    const now = new Date().toISOString();
    const bookings: OpenFutureBooking[] = [];

    for (let offset = 0; ; offset += BOOKING_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("bookings")
        .select("table_id, party_size")
        .in("status", OPEN_BOOKING_STATUSES)
        .gt("ends_at", now)
        .range(offset, offset + BOOKING_PAGE_SIZE - 1);

      if (error) {
        console.error("[admin] could not read future table bookings:", error.message);
        return null;
      }

      const page = (data ?? []) as OpenFutureBooking[];
      bookings.push(...page);
      if (page.length < BOOKING_PAGE_SIZE) return bookings;
    }
  } catch (err) {
    console.error("[admin] getOpenFutureBookings failed:", err);
    return null;
  }
}

export async function getAdminTables(): Promise<GetAdminTablesResult> {
  try {
    const supabase = getServerClient();
    const [{ data: rows, error: tablesError }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabase
          .from("dining_tables")
          .select("id, label, capacity, is_active")
          .order("label", { ascending: true }),
        supabase
          .from("restaurant_settings")
          .select("max_party_size")
          .eq("id", 1)
          .maybeSingle(),
      ]);

    if (tablesError) {
      console.error("[admin] could not read dining_tables:", tablesError.message);
      return { ok: false };
    }
    if (settingsError || !settings) {
      console.error(
        "[admin] could not read restaurant_settings:",
        settingsError?.message ?? "no settings row",
      );
      return { ok: false };
    }

    const bookings = await getOpenFutureBookings();
    if (!bookings) return { ok: false };

    const bookingStats = new Map<string, { count: number; biggestPartySize: number }>();
    for (const booking of bookings) {
      const current = bookingStats.get(booking.table_id) ?? {
        count: 0,
        biggestPartySize: 0,
      };
      current.count += 1;
      current.biggestPartySize = Math.max(current.biggestPartySize, booking.party_size);
      bookingStats.set(booking.table_id, current);
    }

    const tables: AdminTable[] = (rows ?? []).map((row) => {
      const stats = bookingStats.get(row.id) ?? {
        count: 0,
        biggestPartySize: 0,
      };
      return {
        id: row.id,
        label: row.label,
        capacity: row.capacity,
        isActive: row.is_active,
        openFutureBookingCount: stats.count,
        biggestOpenFuturePartySize: stats.biggestPartySize,
      };
    });

    return {
      ok: true,
      tables,
      warningData: {
        maxPartySize: settings.max_party_size,
        biggestActiveTableCapacity: tables.reduce(
          (biggest, table) =>
            table.isActive ? Math.max(biggest, table.capacity) : biggest,
          0,
        ),
      },
    };
  } catch (err) {
    console.error("[admin] getAdminTables failed:", err);
    return { ok: false };
  }
}

export async function addAdminTable(
  label: string,
  capacity: number,
): Promise<AddAdminTableResult> {
  try {
    const supabase = getServerClient();
    const { data: rows, error: readError } = await supabase
      .from("dining_tables")
      .select("label");

    if (readError) {
      console.error("[admin] could not check dining table labels:", readError.message);
      return { ok: false, reason: "unknown" };
    }
    if ((rows ?? []).some((row) => row.label.toLowerCase() === label.toLowerCase())) {
      return { ok: false, reason: "duplicate" };
    }

    const { error } = await supabase
      .from("dining_tables")
      .insert({ label, capacity });

    if (error) {
      if (error.code === "23505") return { ok: false, reason: "duplicate" };
      console.error("[admin] could not add dining table:", error.message);
      return { ok: false, reason: "unknown" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] addAdminTable failed:", err);
    return { ok: false, reason: "unknown" };
  }
}

export async function changeAdminTableSeats(
  tableId: string,
  capacity: number,
): Promise<ChangeAdminTableSeatsResult> {
  try {
    const supabase = getServerClient();
    const bookings = await getOpenFutureBookings();
    if (!bookings) return { ok: false, reason: "unknown" };

    const biggestOpenFuturePartySize = bookings
      .filter((booking) => booking.table_id === tableId)
      .reduce((biggest, booking) => Math.max(biggest, booking.party_size), 0);

    const { data, error } = await supabase
      .from("dining_tables")
      .update({ capacity })
      .eq("id", tableId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[admin] could not change dining table seats:", error.message);
      return { ok: false, reason: "unknown" };
    }
    if (!data) return { ok: false, reason: "not_found" };

    return { ok: true, biggestOpenFuturePartySize };
  } catch (err) {
    console.error("[admin] changeAdminTableSeats failed:", err);
    return { ok: false, reason: "unknown" };
  }
}

export async function setAdminTableActive(
  tableId: string,
  isActive: boolean,
): Promise<SetAdminTableActiveResult> {
  try {
    const supabase = getServerClient();
    const { data: table, error: tableError } = await supabase
      .from("dining_tables")
      .select("id, is_active")
      .eq("id", tableId)
      .maybeSingle();

    if (tableError) {
      console.error("[admin] could not read dining table:", tableError.message);
      return { ok: false, reason: "unknown" };
    }
    if (!table) return { ok: false, reason: "not_found" };

    if (!isActive && table.is_active) {
      const { count, error: countError } = await supabase
        .from("dining_tables")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (countError) {
        console.error("[admin] could not count active dining tables:", countError.message);
        return { ok: false, reason: "unknown" };
      }
      if ((count ?? 0) <= 1) return { ok: false, reason: "last_active" };
    }

    const bookings = await getOpenFutureBookings();
    if (!bookings) return { ok: false, reason: "unknown" };
    const openFutureBookingCount = bookings.filter(
      (booking) => booking.table_id === tableId,
    ).length;

    const { error: updateError } = await supabase
      .from("dining_tables")
      .update({ is_active: isActive })
      .eq("id", tableId);

    if (updateError) {
      console.error("[admin] could not change dining table status:", updateError.message);
      return { ok: false, reason: "unknown" };
    }

    return { ok: true, openFutureBookingCount };
  } catch (err) {
    console.error("[admin] setAdminTableActive failed:", err);
    return { ok: false, reason: "unknown" };
  }
}
