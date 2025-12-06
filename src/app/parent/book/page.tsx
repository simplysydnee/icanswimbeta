import { BookingWizard } from '@/components/booking/BookingWizard';

export default function BookPage() {
  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Book a Session</h1>
        <p className="text-muted-foreground mt-2">
          Select a swimmer and schedule your lesson
        </p>
      </div>
      <BookingWizard />
    </div>
  );
}