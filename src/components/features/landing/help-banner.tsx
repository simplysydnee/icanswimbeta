import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HelpBanner() {
  return (
    <section className="py-12 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
            <p className="text-blue-100 max-w-2xl">
              Our team is here to help you navigate the booking process, answer questions about our adaptive swim lessons,
              and provide support for funding source billing and special needs accommodations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link href="tel:209-985-1538">
                Call Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}