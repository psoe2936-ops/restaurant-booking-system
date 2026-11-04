import { describe, expect, it } from "vitest";
import { bookingLookupSchema } from "@/lib/validation/booking-status";

describe("bookingLookupSchema", () => {
  it("accepts a good code and phone", () => {
    const result = bookingLookupSchema.safeParse({ code: "RB-K279Y", phone: "09123456789" });
    expect(result.success).toBe(true);
  });

  it("removes spaces around the code and the phone", () => {
    const result = bookingLookupSchema.safeParse({ code: "  RB-K279Y  ", phone: "  09123456789  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("RB-K279Y");
      expect(result.data.phone).toBe("09123456789");
    }
  });

  it("refuses a code shorter than 3 or longer than 20 characters", () => {
    expect(bookingLookupSchema.safeParse({ code: "RB", phone: "09123456789" }).success).toBe(false);
    expect(bookingLookupSchema.safeParse({ code: "R".repeat(21), phone: "09123456789" }).success).toBe(false);
  });

  it("refuses a phone shorter than 8 or longer than 30 characters", () => {
    expect(bookingLookupSchema.safeParse({ code: "RB-K279Y", phone: "0912345" }).success).toBe(false);
    expect(bookingLookupSchema.safeParse({ code: "RB-K279Y", phone: "1".repeat(31) }).success).toBe(false);
  });

  it("refuses an empty code or phone, or one with only spaces", () => {
    expect(bookingLookupSchema.safeParse({ code: "", phone: "09123456789" }).success).toBe(false);
    expect(bookingLookupSchema.safeParse({ code: "RB-K279Y", phone: "        " }).success).toBe(false);
  });

  it("refuses missing fields", () => {
    expect(bookingLookupSchema.safeParse({ code: "RB-K279Y" }).success).toBe(false);
    expect(bookingLookupSchema.safeParse({ phone: "09123456789" }).success).toBe(false);
  });
});