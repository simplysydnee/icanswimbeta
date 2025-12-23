import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

interface RegionalCenter {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

export default async function ProgramsPage() {
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
          Our Programs
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Tailored swim programs designed for children with special needs
        </p>
      </div>

      {/* Programs Overview */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Private Pay Program */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-6">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Private Pay Lessons</h2>
            <p className="text-gray-700 mb-6">
              One-on-one instruction with certified adaptive aquatics instructors. Perfect for families looking for personalized attention and flexible scheduling.
            </p>
            <ul className="space-y-3 mb-6">
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
                <span className="text-gray-700">Flexible scheduling</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Personalized lesson plans</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Progress tracking and reports</span>
              </li>
            </ul>
            <a href="/pricing" className="text-cyan-600 font-semibold hover:text-cyan-700">
              View pricing details →
            </a>
          </div>

          {/* VMRC Program */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Regional Center Funded Lessons</h2>
            <p className="text-gray-700 mb-6">
              We are a proud vendor for multiple Regional Centers across California. Eligible families can receive fully funded swim lessons at no out-of-pocket cost.
            </p>

            {/* Regional Center Logos */}
            {regionalCenters && regionalCenters.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Proud vendor for:</p>
                <div className="flex flex-wrap gap-4 items-center">
                  {regionalCenters.map((center) => (
                    <div key={center.id} className="flex flex-col items-center">
                      {center.logo_url ? (
                        <div className="relative w-16 h-16 bg-white rounded-lg p-2 border border-gray-200">
                          <Image
                            src={center.logo_url}
                            alt={center.name}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <span className="text-blue-700 font-semibold text-sm text-center px-1">
                            {center.short_name || center.name}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        {center.short_name || center.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Fully funded for eligible families</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Same quality instruction</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Purchase Order (PO) system</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Coordinator communication</span>
              </li>
            </ul>
            <a href="/regional-centers" className="text-blue-600 font-semibold hover:text-blue-700">
              Learn about regional centers →
            </a>
          </div>
        </div>
      </div>

      {/* Program Structure */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How Our Programs Work</h2>
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-cyan-700 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Initial Assessment</h3>
              <p className="text-gray-700">
                We start with a 30-minute assessment to understand your swimmer&apos;s comfort level, abilities, and goals. This helps us create a personalized learning plan.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-cyan-700 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Plan</h3>
              <p className="text-gray-700">
                Based on the assessment, we create a customized lesson plan targeting specific skills and goals for your swimmer.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-cyan-700 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Regular Lessons</h3>
              <p className="text-gray-700">
                Weekly one-on-one lessons with consistent instructors who build rapport and understand your swimmer&apos;s unique needs.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-cyan-700 font-bold">4</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Updates</h3>
              <p className="text-gray-700">
                Regular progress reports and communication with parents to track achievements and adjust goals as needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}