export const RENT_RELIEF_RECOGNITION_CAP = 500_000;
export const RENT_RELIEF_RATE = 0.2;

export interface RentReliefCalculation {
  recognizedRent: number;
  relief: number;
}

export function calculateRentRelief(annualRentPaid: number): RentReliefCalculation {
  const recognizedRent = Math.min(Math.max(annualRentPaid, 0), RENT_RELIEF_RECOGNITION_CAP);

  return {
    recognizedRent,
    relief: recognizedRent * RENT_RELIEF_RATE,
  };
}
