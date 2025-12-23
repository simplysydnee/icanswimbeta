import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

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

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assessment */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Initial Assessment</h2>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">$75</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              <p className="text-gray-600 mt-2">30-minute session</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Comprehensive skill evaluation</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Personalized lesson plan</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Goal setting with instructor</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Required for all new swimmers</span>
              </li>
            </ul>
            <a
              href="/enroll"
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Book Assessment
            </a>
          </div>

          {/* Private Lessons */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Private Lessons</h2>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">$75</span>
                <span className="text-gray-600 ml-2">per session</span>
              </div>
              <p className="text-gray-600 mt-2">30-minute one-on-one instruction</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">One-on-one instruction</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Weekly scheduling</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Consistent instructor</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Progress tracking & reports</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Flexible cancellation (24-hour notice)</span>
              </li>
            </ul>
            <a
              href="/enroll"
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Enroll Now
            </a>
          </div>
        </div>
      </div>

      {/* Regional Center Funding Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 lg:p-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Client of a Regional Center?</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            We are proud vendors for these Regional Centers. If you're a client, swim lessons may be fully funded at no cost to you.
          </p>
        </div>

        {/* Regional Center Logos */}
        {regionalCenters && regionalCenters.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-6 items-center">
              {regionalCenters.map((center) => (
                <div key={center.id} className="flex flex-col items-center">
                  {center.logo_url ? (
                    <div className="relative w-20 h-20 bg-white rounded-lg p-2 border border-gray-200">
                      <Image
                        src={center.logo_url}
                        alt={center.name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <span className="text-blue-700 font-semibold text-sm text-center px-1">
                        {center.short_name || center.name}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-[80px]">
                    {center.short_name || center.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Contact your Regional Center coordinator to request swim lessons as a service, then reach out to us!
          </p>
          <a
            href="/regional-centers"
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
          >
            Learn more about Regional Center funding →
          </a>
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