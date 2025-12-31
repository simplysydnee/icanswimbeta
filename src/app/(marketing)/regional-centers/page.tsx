import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Check, Phone, Mail } from 'lucide-react'

export const revalidate = 3600 // Revalidate every hour

export default async function RegionalCentersPage() {
  const supabase = await createClient()

  // Fetch ALL active regional centers dynamically
  const { data: regionalCenters, error } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('type', 'regional_center')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching regional centers:', error)
  }

  // Sort with VMRC first, then alphabetically
  const sortedRegionalCenters = regionalCenters?.sort((a, b) => {
    // VMRC always first
    if (a.short_name === 'VMRC' || a.name?.includes('Valley Mountain')) return -1
    if (b.short_name === 'VMRC' || b.name?.includes('Valley Mountain')) return 1
    // Then alphabetically
    return (a.name || '').localeCompare(b.name || '')
  }) || []

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 mb-4">
            Regional Center Funding
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We are proud vendors for multiple Regional Centers across California.
            Eligible individuals can receive fully funded swim lessons at no out-of-pocket cost.
          </p>
        </div>
      </section>

      {/* Regional Centers - Dynamic Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4 space-y-16">
          {sortedRegionalCenters && sortedRegionalCenters.length > 0 ? (
            sortedRegionalCenters.map((rc, index) => (
              <div
                key={rc.id}
                className={`rounded-2xl p-8 md:p-12 ${
                  index % 2 === 0 ? 'bg-cyan-50' : 'bg-slate-50'
                }`}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Logo */}
                  <div className={`flex justify-center ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      {rc.logo_url ? (
                        <div className="relative w-[250px] h-[120px]">
                          <Image
                            src={rc.logo_url}
                            alt={rc.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 250px"
                          />
                        </div>
                      ) : (
                        <div className="w-[250px] h-[120px] flex items-center justify-center">
                          <span className="text-2xl font-bold text-cyan-600">
                            {rc.short_name || rc.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                      {rc.name} {rc.short_name ? `(${rc.short_name})` : ''}
                    </h2>

                    <p className="text-gray-600 mb-6">
                      {rc.description || `We partner with ${rc.name} to provide fully funded adaptive swim lessons for eligible individuals.`}
                      {rc.service_area && (
                        <span> {rc.short_name || rc.name} serves individuals with developmental disabilities in {rc.service_area}.</span>
                      )}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Services Covered */}
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Services Covered</h3>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            Initial assessment
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            Weekly swim lessons
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            Progress tracking
                          </li>
                        </ul>
                      </div>

                      {/* Eligibility */}
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Eligibility</h3>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            {rc.short_name || rc.name} client
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            Approved by coordinator
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            Purchase Order required
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No regional centers found. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How to Get Started</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Contact Your Coordinator</h3>
              <p className="text-gray-600 text-sm">
                Reach out to your Regional Center coordinator to request swim lessons as a service.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Get Approved</h3>
              <p className="text-gray-600 text-sm">
                Once approved, your coordinator will issue a Purchase Order for swim services.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Start Swimming</h3>
              <p className="text-gray-600 text-sm">
                Contact us with your PO number and we'll schedule your assessment!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Client of a Regional Center?
          </h2>
          <p className="text-cyan-100 mb-8 max-w-xl mx-auto">
            If you're a client of VMRC, CVRC, or another Regional Center, you may qualify for fully funded swim lessons. Request a referral to get started!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary Button - WHITE with dark text - HIGH CONTRAST */}
            <Link href="/contact">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-cyan-700 font-semibold hover:bg-cyan-50 shadow-lg px-8"
              >
                Request a Referral
              </Button>
            </Link>

            {/* Secondary Button - White outline with thicker border */}
            <Link href="mailto:info@icanswim209.com">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white font-semibold hover:bg-white hover:text-cyan-700 px-8"
              >
                Questions? Email Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}