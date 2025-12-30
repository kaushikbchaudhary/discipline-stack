import { isOverlapping, timeStringToMinutes } from "@/lib/time";

describe("time helpers", () => {
  it("detects overlapping blocks", () => {
    const blockA = { startTime: 8 * 60, endTime: 10 * 60 };
    const blockB = { startTime: 9 * 60, endTime: 11 * 60 };
    expect(isOverlapping(blockA, blockB)).toBe(true);
  });

  it("handles non-overlapping blocks", () => {
    const blockA = { startTime: 8 * 60, endTime: 9 * 60 };
    const blockB = { startTime: 9 * 60, endTime: 10 * 60 };
    expect(isOverlapping(blockA, blockB)).toBe(false);
  });

  it("parses time strings", () => {
    expect(timeStringToMinutes("06:30")).toBe(390);
  });
});
