import { describe, expect, it } from "vitest";
import { scorePHQ9, severityBand, siFlag, type PHQ9Response } from "@/lib/validation/phq9";

describe("phq9.scorePHQ9", () => {
  it("sums nine items", () => {
    expect(scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(scorePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(27);
    expect(scorePHQ9([2, 1, 2, 1, 1, 1, 1, 1, 0])).toBe(10);
  });

  it("rejects wrong length", () => {
    expect(() => scorePHQ9([0, 0, 0] as unknown as PHQ9Response)).toThrow(/9/);
  });

  it("rejects values outside 0..3", () => {
    expect(() => scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 4])).toThrow(/0..3/);
    expect(() => scorePHQ9([-1, 0, 0, 0, 0, 0, 0, 0, 0])).toThrow(/0..3/);
  });
});

describe("phq9.severityBand", () => {
  it("maps all five bands", () => {
    expect(severityBand(0)).toBe("None");
    expect(severityBand(4)).toBe("None");
    expect(severityBand(5)).toBe("Mild");
    expect(severityBand(9)).toBe("Mild");
    expect(severityBand(10)).toBe("Moderate");
    expect(severityBand(14)).toBe("Moderate");
    expect(severityBand(15)).toBe("Moderately Severe");
    expect(severityBand(19)).toBe("Moderately Severe");
    expect(severityBand(20)).toBe("Severe");
    expect(severityBand(27)).toBe("Severe");
  });

  it("rejects out-of-range totals", () => {
    expect(() => severityBand(-1)).toThrow();
    expect(() => severityBand(28)).toThrow();
  });
});

describe("phq9.siFlag", () => {
  it("is true iff item 9 > 0", () => {
    expect(siFlag([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(false);
    expect(siFlag([0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe(true);
    expect(siFlag([3, 3, 3, 3, 3, 3, 3, 3, 0])).toBe(false);
    expect(siFlag([0, 0, 0, 0, 0, 0, 0, 0, 3])).toBe(true);
  });
});
