import "server-only";
import { getServerClient } from "./server";

export type BookingWindow = {
  minDate: string; // first allowed day, "2026-11-01"
  maxDate: string; // last allowed day
  windowDays: number;
};

// Date in the restaurant's time zone, as "YYYY-MM-DD"
function localDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getBookingWindow(): Promise<BookingWindow> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("booking_window_days, timezone")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Could not load booking window: ${error?.message}`);
  }

  const windowDays = data.booking_window_days as number;
  const today = localDate(new Date(), data.timezone || "Asia/Yangon");

  return {
    minDate: today,
    maxDate: addDays(today, windowDays),
    windowDays,
  };
}