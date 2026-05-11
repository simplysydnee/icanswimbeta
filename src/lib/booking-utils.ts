export interface BookingSwimmer {
  paymentType?: string;
}

export function isSwimmerFunded(swimmer: BookingSwimmer): boolean {
  return (
    swimmer.paymentType === 'funded' ||
    swimmer.paymentType === 'funding_source'
  );
}
