import { describe, expect, it } from "vitest";
import { openingHoursSchema } from "@/lib/validation/admin-hours";

function week() {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isClosed: false,
    openTime: "10:00",
    closeTime: "21:00",
  }));
}

describe("openingHoursSchema", () => {
  it("accepts a normal week", () => {
    expect(openingHoursSchema.safeParse(week()).success).toBe(true);
  });

  it("needs exactly 7 days", () => {
    expect(openingHoursSchema.safeParse(week().slice(0, 6)).success).toBe(
      false,
    );
  });

  it("refuses the same weekday two times", () => {
    const rows = week();
    rows[6] = { ...rows[6], weekday: 0 };
    expect(openingHoursSchema.safeParse(rows).success).toBe(false);
  });

  it("refuses a close time that is not later than the open time", () => {
    const rows = week();
    rows[1] = { ...rows[1], openTime: "21:00", closeTime: "10:00" };
    expect(openingHoursSchema.safeParse(rows).success).toBe(false);

    rows[1] = { ...rows[1], openTime: "10:00", closeTime: "10:00" };
    expect(openingHoursSchema.safeParse(rows).success).toBe(false);
  });

  it("refuses a time that is not a real time", () => {
    const rows = week();
    rows[2] = { ...rows[2], openTime: "25:00" };
    expect(openingHoursSchema.safeParse(rows).success).toBe(false);

    rows[2] = { ...rows[2], openTime: "" };
    expect(openingHoursSchema.safeParse(rows).success).toBe(false);
  });

  it("does not check the times of a closed day", () => {
    const rows = week();
    rows[3] = { weekday: 3, isClosed: true, openTime: "", closeTime: "" };
    expect(openingHoursSchema.safeParse(rows).success).toBe(true);
  });
});