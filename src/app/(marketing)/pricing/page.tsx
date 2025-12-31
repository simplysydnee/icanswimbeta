import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ClipboardCheck, Zap, Shield } from 'lucide-react';

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

  const regionalCenterNames = regionalCenters?.map(fs => fs.name) || ['VMRC', 'CVRC'];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
          Pricing
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Transparent pricing for adaptive swim lessons
        </p>
      </div>

      {/* Pricing Cards - 3 columns */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Initial Assessment */}
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Initial Assessment</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$175</span>
              <span className="text-gray-500 ml-1">one-time</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">30-minute session</p>
            <ul className="text-left space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Comprehensive skill evaluation
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Personalized lesson plan
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Goal setting with instructor
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Required for all new swimmers
              </li>
            </ul>
            <Button className="w-full">Book Assessment</Button>
          </Card>

          {/* Card 2: Private Lessons */}
          <Card className="p-6 text-center border-2 border-cyan-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Private Lessons</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$90</span>
              <span className="text-gray-500 ml-1">per session</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">30-minute one-on-one instruction</p>
            <ul className="text-left space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                One-on-one instruction
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Flexible scheduling
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Consistent instructor
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-cyan-600" />
                Progress tracking & reports
              </li>
            </ul>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Enroll Now</Button>
          </Card>

          {/* Card 3: Regional Center Funded */}
          <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-cyan-50">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Regional Center Funded</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-green-600">$0</span>
              <span className="text-gray-500 ml-1">for eligible families</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">Fully funded through your Regional Center</p>
            <ul className="text-left space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                Same quality instruction
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                No out-of-pocket cost
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                We handle all paperwork
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                Vendor for: {regionalCenterNames.join(', ')}
              </li>
            </ul>
            <Link href="/regional-centers">
              <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                Check Eligibility
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Payment Options */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Payment Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center border">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit/Debit Card</h3>
            <p className="text-gray-600 text-sm">Secure online payments</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer</h3>
            <p className="text-gray-600 text-sm">Direct bank payments</p>
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
      </div>
    </div>
  );
}