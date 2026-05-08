export interface BookingSwimmer {
  paymentType?: string;
  fundingSourceId?: string | null;
}

export function isSwimmerFunded(swimmer: BookingSwimmer): boolean {
  return (
    swimmer.paymentType === 'funded' ||
    swimmer.paymentType === 'scholarship' ||
    !!swimmer.fundingSourceId
  );
}
