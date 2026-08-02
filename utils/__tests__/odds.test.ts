import { oddsToMultiplier, calculateParlayOdds } from "../odds";

describe("oddsToMultiplier", () => {
  it("converts positive American odds to a decimal multiplier", () => {
    expect(oddsToMultiplier(150)).toBe(2.5);
    expect(oddsToMultiplier(100)).toBe(2);
  });

  it("converts negative American odds to a decimal multiplier", () => {
    expect(oddsToMultiplier(-150)).toBe(1.67);
    expect(oddsToMultiplier(-100)).toBe(2);
  });

  it("returns 1 for odds of 0", () => {
    expect(oddsToMultiplier(0)).toBe(1);
  });
});

describe("calculateParlayOdds", () => {
  it("returns a single leg's own multiplier for a one-leg bet", () => {
    const { decimalMultiplier, americanOdds } = calculateParlayOdds(["150"]);
    expect(decimalMultiplier).toBe(2.5);
    expect(americanOdds).toBe("+150");
  });

  it("multiplies decimal odds across legs (standard parlay math), not adds them", () => {
    // Leg 1: -110 -> decimal 1.909...
    // Leg 2: -110 -> decimal 1.909...
    // Multiplicative combination: ~3.645, NOT the additive 2.818 the old buggy
    // code would have produced (1.909 + 1.909 - 1... well acc+o starting at o).
    const { decimalMultiplier } = calculateParlayOdds(["-110", "-110"]);
    expect(decimalMultiplier).toBeCloseTo(1.9090909 * 1.9090909, 5);
  });

  it("combines two positive-odds legs into the correct American odds string", () => {
    // +100 -> decimal 2.0, +100 -> decimal 2.0, product = 4.0 -> +300 American
    const { americanOdds, decimalMultiplier } = calculateParlayOdds([100, 100]);
    expect(decimalMultiplier).toBe(4);
    expect(americanOdds).toBe("+300");
  });

  it("formats a combined multiplier below 2 as negative American odds", () => {
    // Two heavy favorites: -300 (decimal 1.333) * -300 (decimal 1.333) = 1.778
    const { americanOdds, decimalMultiplier } = calculateParlayOdds([-300, -300]);
    expect(decimalMultiplier).toBeCloseTo(1.7778, 3);
    expect(americanOdds).toBe(`${Math.round(-100 / (decimalMultiplier - 1))}`);
    expect(americanOdds.startsWith("-")).toBe(true);
  });

  it("handles the boundary where the combined multiplier is exactly 2", () => {
    const { americanOdds, decimalMultiplier } = calculateParlayOdds([100]);
    expect(decimalMultiplier).toBe(2);
    expect(americanOdds).toBe("+100");
  });

  it("supports a three-leg parlay", () => {
    const { decimalMultiplier } = calculateParlayOdds(["150", "-110", "200"]);
    const expected = 2.5 * (100 / 110 + 1) * 3;
    expect(decimalMultiplier).toBeCloseTo(expected, 5);
  });
});
