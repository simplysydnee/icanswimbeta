export interface BookingSwimmer {
  paymentType?: string;
}

export function isSwimmerFunded(swimmer: BookingSwimmer): boolean {
  return (
    swimmer.paymentType === 'funded' ||
    swimmer.paymentType === 'funding_source'
  );
}

// Assessment price constant (centralized — update here when price changes)
export const ASSESSMENT_PRICE_CENTS = 17500;
