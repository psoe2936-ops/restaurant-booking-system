import { z } from "zod";

export const BOOKINGS_PAGE_SIZE = 20;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingFilters = {
  date: string | null; // "2026-11-07" (restaurant date) or null
  status: BookingStatus | null;
  q: string; // cleaned search text, "" if none
  page: number; // 1, 2, 3...
};

export const DEFAULT_BOOKING_FILTERS: BookingFilters = {
  date: null,
  status: null,
  q: "",
  page: 1,
};

// "2026-02-31" has the right shape, but it is not a real day.
function isRealDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealDate);

const statusSchema = z.enum(BOOKING_STATUSES);

const pageSchema = z.string().regex(/^\d{1,4}$/);

// Keep only letters (any language, also Myanmar), numbers, spaces, + and -.
// Other characters (comma, brackets, quotes, %, _ ...) could break the
// database filter, so we remove them.
// (Written with new RegExp(...) so it works with any TypeScript target.)
const UNSAFE_SEARCH_CHARS = new RegExp("[^\\p{L}\\p{N}\\p{M}\\s+\\-]", "gu");

export function cleanSearchText(input: string): string {
  return input
    .replace(UNSAFE_SEARCH_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

type RawValue = string | string[] | undefined;

function first(value: RawValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Reads the page address (searchParams). A wrong value is ignored,
// and we use the default for it. It never throws.
export function parseBookingFilters(
  raw: Record<string, RawValue>,
): BookingFilters {
  const date = dateSchema.safeParse(first(raw.date));
  const status = statusSchema.safeParse(first(raw.status));
  const page = pageSchema.safeParse(first(raw.page));

  const pageNumber = page.success ? Number(page.data) : 1;

  return {
    date: date.success ? date.data : null,
    status: status.success ? status.data : null,
    q: cleanSearchText(first(raw.q) ?? ""),
    page: pageNumber >= 1 ? pageNumber : 1,
  };
}