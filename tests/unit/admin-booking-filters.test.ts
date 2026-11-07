import { describe, expect, it } from "vitest";
import {
  cleanSearchText,
  parseBookingFilters,
} from "@/lib/validation/admin-bookings";

describe("parseBookingFilters", () => {
  it("uses defaults when nothing is given", () => {
    expect(parseBookingFilters({})).toEqual({
      date: null,
      status: null,
      q: "",
      page: 1,
    });
  });

  it("accepts a real date", () => {
    expect(parseBookingFilters({ date: "2026-11-07" }).date).toBe("2026-11-07");
  });

  it("ignores a date that is not real", () => {
    expect(parseBookingFilters({ date: "2026-02-31" }).date).toBeNull();
    expect(parseBookingFilters({ date: "abc" }).date).toBeNull();
    expect(parseBookingFilters({ date: "7-11-2026" }).date).toBeNull();
  });

  it("accepts a real status and ignores a wrong one", () => {
    expect(parseBookingFilters({ status: "pending" }).status).toBe("pending");
    expect(parseBookingFilters({ status: "no_show" }).status).toBe("no_show");
    expect(parseBookingFilters({ status: "all" }).status).toBeNull();
    expect(parseBookingFilters({ status: "hack" }).status).toBeNull();
  });

  it("reads the page number and falls back to 1", () => {
    expect(parseBookingFilters({ page: "2" }).page).toBe(2);
    expect(parseBookingFilters({ page: "0" }).page).toBe(1);
    expect(parseBookingFilters({ page: "-1" }).page).toBe(1);
    expect(parseBookingFilters({ page: "abc" }).page).toBe(1);
  });

  it("uses the first value when the address has the same key twice", () => {
    expect(parseBookingFilters({ status: ["confirmed", "pending"] }).status).toBe(
      "confirmed",
    );
  });

  it("cleans the search text", () => {
    expect(parseBookingFilters({ q: "  pang, soe) " }).q).toBe("pang soe");
  });
});

describe("cleanSearchText", () => {
  it("removes characters that could break the database filter", () => {
    expect(cleanSearchText('  pang,  soe) "x"% ')).toBe("pang soe x");
    expect(cleanSearchText("a_b*c(d)")).toBe("abcd");
  });

  it("keeps letters, numbers, spaces, + and -", () => {
    expect(cleanSearchText("+95 9-123")).toBe("+95 9-123");
    expect(cleanSearchText("RB-ACBG8")).toBe("RB-ACBG8");
  });

  it("keeps Myanmar text", () => {
    expect(cleanSearchText("မောင်မောင်")).toBe("မောင်မောင်");
  });

  it("cuts the text at 50 characters", () => {
    expect(cleanSearchText("a".repeat(80))).toHaveLength(50);
  });
});