import { describe, expect, it } from "vitest";
import { formatLongDate } from "@/app/lib/date";

describe("formatLongDate", () => {
  it.each([
    ["2026-11-28", "November 28th, 2026"],
    ["2026-01-01", "January 1st, 2026"],
    ["2026-02-02", "February 2nd, 2026"],
    ["2026-03-03", "March 3rd, 2026"],
    ["2026-04-11", "April 11th, 2026"],
    ["2026-04-12", "April 12th, 2026"],
    ["2026-04-13", "April 13th, 2026"],
    ["2018-10-26", "October 26th, 2018"],
  ])("formats %s", (value, expected) => {
    expect(formatLongDate(value)).toBe(expected);
  });

  it("falls back for missing or invalid dates", () => {
    expect(formatLongDate(null)).toBe("Release TBA");
    expect(formatLongDate("invalid")).toBe("Release TBA");
  });
});
