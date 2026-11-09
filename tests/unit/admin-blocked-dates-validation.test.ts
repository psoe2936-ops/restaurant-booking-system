import { describe, expect, it } from "vitest";
import {
  addBlockedDateSchema,
  cleanReason,
  isRealDate,
  removeBlockedDateSchema,
} from "@/lib/validation/admin-blocked-dates";

describe("admin blocked date validation", () => {
  it("accepts a future date and cleans its reason", () => {
    const result = addBlockedDateSchema.safeParse({
      date: "2099-12-25",
      reason: "  Private   event\n",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Private event");
    }
  });

  it("rejects an invalid or past date", () => {
    expect(isRealDate("2099-02-29")).toBe(false);
    expect(
      addBlockedDateSchema.safeParse({
        date: "not-a-date",
        reason: "",
      }).success,
    ).toBe(false);
    expect(
      addBlockedDateSchema.safeParse({
        date: "2000-01-01",
        reason: "",
      }).success,
    ).toBe(false);
  });

  it("turns an empty reason into null", () => {
    const result = addBlockedDateSchema.parse({
      date: "2099-12-25",
      reason: "   ",
    });
    expect(result.reason).toBeNull();
  });

  it("limits cleaned reasons to 100 characters", () => {
    expect(cleanReason("x".repeat(150))).toHaveLength(100);
  });

  it("allows removing a past real date", () => {
    expect(removeBlockedDateSchema.safeParse({ date: "2000-01-01" }).success).toBe(
      true,
    );
  });
});
