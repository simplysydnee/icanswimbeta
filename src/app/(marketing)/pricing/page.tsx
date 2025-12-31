import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, CreditCard, Shield } from 'lucide-react';

interface RegionalCenter {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

export default async function PricingPage() {
  const supabase = await createClient();

  let regionalCenters: RegionalCenter[] = [];
  try {
    const { data, error } = await supabase
      .from('funding_sources')
      .select('id, name, short_name, logo_url')
      .eq('source_type', 'regional_center')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching regional centers:', error);
    } else {
      regionalCenters = data || [];
    }
  } catch (error) {
    console.error('Error in regional centers query:', error);
    regionalCenters = [];
  }

  const regionalCenterNames = regionalCenters?.map(fs => fs.short_name || fs.name) || ['VMRC', 'CVRC'];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 mb-4">
            Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparent pricing for adaptive swim lessons
          </p>
        </div>
      </section>

      {/* Pricing Cards - 2 columns */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

            {/* Private Pay Card */}
            <Card className="p-8 flex flex-col">
              <div className="flex-1">
                <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-6">Private Pay</h3>

                {/* Two price rows */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Initial Assessment (Required)</p>
                    <div>
                      <span className="text-3xl font-bold">$175</span>
                      <span className="text-gray-500 ml-1">one-time</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">30-minute evaluation</p>
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4 text-center border-2 border-cyan-200">
                    <p className="text-sm text-gray-500 mb-1">Weekly Lessons</p>
                    <div>
                      <span className="text-3xl font-bold text-cyan-600">$90</span>
                      <span className="text-gray-500 ml-1">per session</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">30-minute one-on-one instruction</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    Comprehensive skill evaluation
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    Personalized lesson plan
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    Consistent instructor
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    Flexible scheduling
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    Progress tracking & reports
                  </li>
                </ul>
              </div>

              <Link href="/contact" className="w-full">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Get Started
                </Button>
              </Link>
            </Card>

            {/* Regional Center Card - Most Popular */}
            <Card className="p-8 flex flex-col bg-gradient-to-br from-green-50 to-cyan-50 border-2 border-green-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-medium px-4 py-1 rounded-full">
                Most Popular
              </div>

              <div className="flex-1">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-6">Regional Center Funded</h3>

                {/* Price display */}
                <div className="text-center mb-6">
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <span className="text-4xl font-bold text-green-600">$0</span>
                    <span className="text-gray-500 ml-2">for eligible families</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Fully funded through your Regional Center
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Same quality instruction
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    No out-of-pocket cost
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    We handle all paperwork
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Assessment included
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Vendor for: {regionalCenterNames.join(', ')}
                  </li>
                </ul>
              </div>

              <Link href="/regional-centers" className="w-full">
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                  Learn About Funding
                </Button>
              </Link>
            </Card>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Not Sure Which Option?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            If you're a client of a Regional Center, you may qualify for fully funded lessons.
            Contact your coordinator to find out!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/regional-centers">
              <Button variant="outline">
                Check Regional Center Eligibility
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">
                Contact Us With Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Options - Updated */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Payment Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center border">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit/Debit Card</h3>
              <p className="text-gray-600 text-sm">Pay invoices securely online</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Regional Center Funding</h3>
              <p className="text-gray-600 text-sm">No cost for eligible families</p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6 max-w-xl mx-auto">
            Private pay clients receive invoices after each session. Payments can be made online via credit/debit card.
          </p>
        </div>
      </section>
    </div>
  );
}