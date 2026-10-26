export const RENT_RELIEF_CAP = 500_000;
export const RENT_RELIEF_RATE = 0.2;

export interface RentReliefCalculation {
  annualRentPaid: number;
  relief: number;
}

export function calculateRentRelief(annualRentPaid: number): RentReliefCalculation {
  const qualifyingRent = Number.isFinite(annualRentPaid) ? Math.max(annualRentPaid, 0) : 0;

  return {
    annualRentPaid: qualifyingRent,
    relief: Math.min(qualifyingRent * RENT_RELIEF_RATE, RENT_RELIEF_CAP),
  };
}
