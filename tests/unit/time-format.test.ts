import { describe, expect, it } from "vitest";
import { formatDate, formatTime } from "../../src/lib/time/format";

// Yangon time is UTC+6:30, so 05:30 UTC is 12:00 in Yangon.
describe("formatTime", () => {
  it("shows the Yangon time", () => {
    expect(formatTime("2026-11-02T05:30:00+00:00")).toBe("12:00");
  });

  it("uses 24-hour time and 2 digits", () => {
    expect(formatTime("2026-11-02T01:00:00+00:00")).toBe("07:30");
  });

  it("goes to the next day after midnight in Yangon", () => {
    // 18:00 UTC is 00:30 the next day in Yangon
    expect(formatTime("2026-11-02T18:00:00+00:00")).toBe("00:30");
  });
});

describe("formatDate", () => {
  it("shows the Yangon date", () => {
    // Some Node versions write "Mon, 2 Nov 2026" and some write "Mon 2 Nov 2026".
    // The comma is optional here so the test is stable.
    expect(formatDate("2026-11-02T05:30:00+00:00")).toMatch(/^Mon,? 2 Nov 2026$/);
  });

  it("uses the Yangon date, not the UTC date", () => {
    // 18:00 UTC on 2 Nov is already 3 Nov in Yangon
    expect(formatDate("2026-11-02T18:00:00+00:00")).toMatch(/^Tue,? 3 Nov 2026$/);
  });
});