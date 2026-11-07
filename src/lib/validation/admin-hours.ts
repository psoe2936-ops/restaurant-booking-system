import { z } from "zod";

// 0 = Sunday ... 6 = Saturday (the same as the database: extract(dow ...))
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// The page shows Monday first and Sunday last.
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // "09:00", "21:30"

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const dayRowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

export const openingHoursSchema = z
  .array(dayRowSchema)
  .length(7)
  .superRefine((rows, ctx) => {
    const seen = new Set<number>();

    rows.forEach((row, index) => {
      const day = DAY_NAMES[row.weekday] ?? "Day";

      if (seen.has(row.weekday)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "weekday"],
          message: `${day} is in the list two times.`,
        });
      }
      seen.add(row.weekday);

      if (row.isClosed) return; // a closed day needs no times

      if (!TIME_PATTERN.test(row.openTime)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "openTime"],
          message: `${day}: please choose an open time.`,
        });
        return;
      }

      if (!TIME_PATTERN.test(row.closeTime)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "closeTime"],
          message: `${day}: please choose a close time.`,
        });
        return;
      }

      if (toMinutes(row.closeTime) <= toMinutes(row.openTime)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "closeTime"],
          message: `${day}: the close time must be later than the open time.`,
        });
      }
    });
  });

export type OpeningHoursInput = z.input<typeof openingHoursSchema>;
export type OpeningHoursValues = z.output<typeof openingHoursSchema>;