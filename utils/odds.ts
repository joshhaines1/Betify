// American-odds math shared by the bet slip (app/group.tsx) and BetSlipView.

/** Converts a single leg's American odds to a decimal payout multiplier. */
export const oddsToMultiplier = (odds: number): number => {
  if (odds > 0) return +(odds / 100 + 1).toFixed(2);
  if (odds < 0) return +(100 / Math.abs(odds) + 1).toFixed(2);
  return 1;
};

/** Converts a single leg's American odds to a decimal multiplier (unrounded). */
const americanToDecimal = (american: number): number =>
  american < 0 ? 100 / Math.abs(american) + 1 : american / 100 + 1;

/** Formats a decimal multiplier back into an American odds string. */
const decimalToAmericanString = (decimal: number): string =>
  decimal >= 2
    ? `+${Math.round((decimal - 1) * 100)}`
    : `${Math.round(-100 / (decimal - 1))}`;

export interface ParlayOdds {
  americanOdds: string;
  decimalMultiplier: number;
}

/**
 * Combines the American odds of every leg in a parlay into a single
 * decimal multiplier and its American-odds string representation.
 * Standard parlay math multiplies each leg's decimal odds together.
 */
export const calculateParlayOdds = (legOdds: (string | number)[]): ParlayOdds => {
  const decimalOdds = legOdds.map((o) => americanToDecimal(+o));

  const decimalMultiplier = decimalOdds.reduce((acc, o) => acc * o, 1);

  return {
    americanOdds: decimalToAmericanString(decimalMultiplier),
    decimalMultiplier,
  };
};
