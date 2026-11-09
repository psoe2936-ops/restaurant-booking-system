import { z } from "zod";

const TIME_ZONE = "Asia/Yangon";

/**
 * Today's date in the restaurant time zone, like "2026-11-08".
 * The "en-CA" format gives year-month-day, which is what we need.
 */
export function todayInYangon(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True if the text is a real calendar date like "2026-12-25". */
export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const REASON_MAX_LENGTH = 100;

/** Remove control characters, extra spaces, and cut to the max length. */
export function cleanReason(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, REASON_MAX_LENGTH);
}

const dateSchema = z
  .string()
  .refine(isRealDate, { message: "Please choose a real date." });

/** Input for adding a blocked day. */
export const addBlockedDateSchema = z
  .object({
    date: dateSchema,
    reason: z.string().max(500).optional().default(""),
  })
  .refine((value) => value.date >= todayInYangon(), {
    message: "Please choose today or a future day.",
    path: ["date"],
  })
  .transform((value) => {
    const reason = cleanReason(value.reason);
    return {
      date: value.date,
      reason: reason === "" ? null : reason,
    };
  });

/** Input for removing a blocked day. Past days are allowed here. */
export const removeBlockedDateSchema = z.object({
  date: dateSchema,
});

export type AddBlockedDateInput = z.infer<typeof addBlockedDateSchema>;
export type RemoveBlockedDateInput = z.infer<typeof removeBlockedDateSchema>;