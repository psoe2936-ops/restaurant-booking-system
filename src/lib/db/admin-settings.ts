import "server-only";
import { getServerClient } from "@/lib/db/server";
import type { RestaurantSettingsValues } from "@/lib/validation/admin-settings";

export type RestaurantSettingsRow = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  slotLengthMin: number;
  slotIntervalMin: number;
  maxPartySize: number;
  bookingWindowDays: number;
};

export type GetSettingsResult =
  | { ok: true; settings: RestaurantSettingsRow }
  | { ok: false };

export async function getRestaurantSettings(): Promise<GetSettingsResult> {
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from("restaurant_settings")
      .select(
        "id, name, phone, address, timezone, slot_length_min, slot_interval_min, max_party_size, booking_window_days",
      )
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[admin] could not read restaurant_settings:", error.message);
      return { ok: false };
    }

    if (!data) {
      console.error("[admin] restaurant_settings has no row");
      return { ok: false };
    }

    return {
      ok: true,
      settings: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        timezone: data.timezone,
        slotLengthMin: data.slot_length_min,
        slotIntervalMin: data.slot_interval_min,
        maxPartySize: data.max_party_size,
        bookingWindowDays: data.booking_window_days,
      },
    };
  } catch (err) {
    console.error("[admin] getRestaurantSettings failed:", err);
    return { ok: false };
  }
}

export async function updateRestaurantSettings(
  values: RestaurantSettingsValues,
): Promise<{ ok: boolean }> {
  try {
    const supabase = getServerClient();

    // The table has one row. Find its id first.
    const { data: row, error: readError } = await supabase
      .from("restaurant_settings")
      .select("id")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (readError || !row) {
      console.error(
        "[admin] could not find the settings row:",
        readError?.message ?? "no row",
      );
      return { ok: false };
    }

    const { error } = await supabase
      .from("restaurant_settings")
      .update({
        name: values.name,
        phone: values.phone,
        address: values.address,
        slot_length_min: values.slotLengthMin,
        slot_interval_min: values.slotIntervalMin,
        max_party_size: values.maxPartySize,
        booking_window_days: values.bookingWindowDays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      console.error("[admin] could not update settings:", error.message);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin] updateRestaurantSettings crashed:", err);
    return { ok: false };
  }
}