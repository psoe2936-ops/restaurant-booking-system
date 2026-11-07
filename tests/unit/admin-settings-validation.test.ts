import { describe, expect, it } from "vitest";
import { restaurantSettingsSchema } from "@/lib/validation/admin-settings";

const valid = {
  name: "Thazin Kitchen",
  phone: "09 123 456 789",
  address: "Main Road, Mawlamyine",
  slotLengthMin: 90,
  slotIntervalMin: 30,
  maxPartySize: 10,
  bookingWindowDays: 14,
};

describe("restaurantSettingsSchema", () => {
  it("accepts good values", () => {
    expect(restaurantSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("turns an empty phone and address into null", () => {
    const result = restaurantSettingsSchema.parse({
      ...valid,
      phone: "  ",
      address: "",
    });
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
  });

  it("needs a name", () => {
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, name: "   " }).success,
    ).toBe(false);
  });

  it("refuses numbers outside the safe range", () => {
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, bookingWindowDays: 0 })
        .success,
    ).toBe(false);
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, bookingWindowDays: 91 })
        .success,
    ).toBe(false);
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, slotLengthMin: 10 })
        .success,
    ).toBe(false);
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, maxPartySize: 0 }).success,
    ).toBe(false);
  });

  it("refuses numbers with decimals", () => {
    expect(
      restaurantSettingsSchema.safeParse({ ...valid, slotLengthMin: 90.5 })
        .success,
    ).toBe(false);
  });

  it("refuses a slot interval longer than the slot length", () => {
    expect(
      restaurantSettingsSchema.safeParse({
        ...valid,
        slotLengthMin: 60,
        slotIntervalMin: 90,
      }).success,
    ).toBe(false);
  });
});