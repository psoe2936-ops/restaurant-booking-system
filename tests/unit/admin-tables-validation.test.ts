import { describe, expect, it } from "vitest";
import {
  addTableSchema,
  changeTableSeatsSchema,
  setTableActiveSchema,
} from "@/lib/validation/admin-tables";

describe("admin tables validation", () => {
  it("trims a table label and accepts valid seats", () => {
    expect(addTableSchema.parse({ label: " T1 ", capacity: 4 })).toEqual({
      label: "T1",
      capacity: 4,
    });
  });

  it("rejects empty or too-long labels and control characters", () => {
    expect(addTableSchema.safeParse({ label: "  ", capacity: 2 }).success).toBe(
      false,
    );
    expect(addTableSchema.safeParse({ label: "x".repeat(21), capacity: 2 }).success).toBe(
      false,
    );
    expect(addTableSchema.safeParse({ label: "T\n1", capacity: 2 }).success).toBe(
      false,
    );
  });

  it("accepts only whole seat counts from 1 to 50", () => {
    for (const capacity of [0, 51, 2.5]) {
      expect(addTableSchema.safeParse({ label: "T1", capacity }).success).toBe(
        false,
      );
    }
    expect(addTableSchema.safeParse({ label: "T1", capacity: 50 }).success).toBe(
      true,
    );
  });

  it("validates table IDs and active status inputs", () => {
    const tableId = "d9428888-122b-4b89-9c4a-9cbaa0cfdd35";
    expect(
      changeTableSeatsSchema.safeParse({ tableId, capacity: 3 }).success,
    ).toBe(true);
    expect(
      changeTableSeatsSchema.safeParse({ tableId: "bad-id", capacity: 3 })
        .success,
    ).toBe(false);
    expect(setTableActiveSchema.safeParse({ tableId, isActive: false }).success).toBe(
      true,
    );
    expect(setTableActiveSchema.safeParse({ tableId, isActive: "false" }).success).toBe(
      false,
    );
  });
});
