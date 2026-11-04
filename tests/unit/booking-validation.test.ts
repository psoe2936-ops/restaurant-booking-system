import { describe, expect, it } from "vitest";
import { createBookingSchema, slotsQuerySchema } from "@/lib/validation/booking";

// A good booking. Each test changes only one thing.
const validBooking = {
  guestName: "Aye Aye",
  phone: "09 123 456 789",
  email: "aye@example.com",
  partySize: 4,
  startsAt: "2026-11-05T05:30:00+00:00",
  notes: "Near the window, please",
};

describe("slotsQuerySchema", () => {
  it("accepts a good date and party size", () => {
    const result = slotsQuerySchema.safeParse({ date: "2026-11-05", partySize: 2 });
    expect(result.success).toBe(true);
  });

  it("turns a party size text into a number", () => {
    // the value can come from a URL or a form, so it is text
    const result = slotsQuerySchema.safeParse({ date: "2026-11-05", partySize: "4" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.partySize).toBe(4);
  });

  it("refuses a wrong date format", () => {
    expect(slotsQuerySchema.safeParse({ date: "2026-1-5", partySize: 2 }).success).toBe(false);
    expect(slotsQuerySchema.safeParse({ date: "05/11/2026", partySize: 2 }).success).toBe(false);
  });

  it("refuses a party size of 0, 51 or 2.5", () => {
    expect(slotsQuerySchema.safeParse({ date: "2026-11-05", partySize: 0 }).success).toBe(false);
    expect(slotsQuerySchema.safeParse({ date: "2026-11-05", partySize: 51 }).success).toBe(false);
    expect(slotsQuerySchema.safeParse({ date: "2026-11-05", partySize: 2.5 }).success).toBe(false);
  });
});

describe("createBookingSchema", () => {
  it("accepts a good booking", () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("removes spaces around the name", () => {
    const result = createBookingSchema.safeParse({ ...validBooking, guestName: "  Aye Aye  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.guestName).toBe("Aye Aye");
  });

  it("refuses an empty name or a name with only spaces", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, guestName: "" }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...validBooking, guestName: "   " }).success).toBe(false);
  });

  it("refuses a name longer than 100 characters", () => {
    const result = createBookingSchema.safeParse({ ...validBooking, guestName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts phone numbers in different styles", () => {
    for (const phone of ["09123456789", "+95 9 123 456 789", "09-123-456-789", "(09) 123 4567"]) {
      expect(createBookingSchema.safeParse({ ...validBooking, phone }).success).toBe(true);
    }
  });

  it("refuses a bad phone number", () => {
    for (const phone of ["12345", "abc1234567", "09123456789!", "1".repeat(21)]) {
      expect(createBookingSchema.safeParse({ ...validBooking, phone }).success).toBe(false);
    }
  });

  it("shows a clear message for a bad phone number", () => {
    const result = createBookingSchema.safeParse({ ...validBooking, phone: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid phone number");
    }
  });

    it("allows the email to be missing or empty", () => {
    const withoutEmail: Partial<typeof validBooking> = { ...validBooking };
    delete withoutEmail.email;
    expect(createBookingSchema.safeParse(withoutEmail).success).toBe(true);
    expect(createBookingSchema.safeParse({ ...validBooking, email: "" }).success).toBe(true);
  });

  it("refuses a bad email", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, email: "not-an-email" }).success).toBe(false);
  });

  it("refuses a party size of 0", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, partySize: 0 }).success).toBe(false);
  });

  it("refuses a start time that is not a date", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, startsAt: "tomorrow" }).success).toBe(false);
  });

    it("allows notes to be missing, but not longer than 500 characters", () => {
    const withoutNotes: Partial<typeof validBooking> = { ...validBooking };
    delete withoutNotes.notes;
    expect(createBookingSchema.safeParse(withoutNotes).success).toBe(true);
    expect(createBookingSchema.safeParse({ ...validBooking, notes: "a".repeat(501) }).success).toBe(false);
  });
});