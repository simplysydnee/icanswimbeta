'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Phone, Mail } from 'lucide-react';
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';
import { useEditMode } from '@/contexts/EditModeContext';

interface FundingSource {
  id: string;
  name: string;
  short_name: string | null;
  description: string | null;
  logo_url: string | null;
  service_area: string | null;
}

interface RegionalCentersContentProps {
  regionalCenters: FundingSource[];
}

export default function RegionalCentersContent({ regionalCenters }: RegionalCentersContentProps) {
  const { editMode } = useEditMode();
  const { data: content, isLoading } = usePageContent('regional-centers', editMode);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  // Sort with VMRC first, then alphabetically
  const sortedRegionalCenters = regionalCenters?.sort((a, b) => {
    // VMRC always first
    if (a.short_name === 'VMRC' || a.name?.includes('Valley Mountain')) return -1;
    if (b.short_name === 'VMRC' || b.name?.includes('Valley Mountain')) return 1;
    // Then alphabetically
    return (a.name || '').localeCompare(b.name || '');
  }) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            pageSlug="regional-centers"
            sectionKey="hero-title"
            defaultContent="Funding Sources"
            as="h1"
            className="text-4xl md:text-5xl font-bold text-cyan-600 mb-4"
          >
            {getContent(content, 'hero-title', 'Funding Sources')}
          </EditableText>
          <EditableText
            pageSlug="regional-centers"
            sectionKey="hero-subtitle"
            defaultContent="We partner with Regional Centers and Self Determination programs across California. Eligible individuals can receive fully funded swim lessons at no out-of-pocket cost."
            as="p"
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            {getContent(content, 'hero-subtitle', 'We partner with Regional Centers and Self Determination programs across California. Eligible individuals can receive fully funded swim lessons at no out-of-pocket cost.')}
          </EditableText>
        </div>
      </section>

      {/* Funding Sources - Dynamic Cards */}
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

                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Services Covered */}
                      <div>
                        <EditableText
                          pageSlug="regional-centers"
                          sectionKey="services-covered-title"
                          defaultContent="Services Covered"
                          as="h3"
                          className="font-semibold text-slate-800 mb-3"
                        >
                          {getContent(content, 'services-covered-title', 'Services Covered')}
                        </EditableText>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            <EditableText
                              pageSlug="regional-centers"
                              sectionKey="service-1"
                              defaultContent="Initial assessment"
                              as="span"
                            >
                              {getContent(content, 'service-1', 'Initial assessment')}
                            </EditableText>
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            <EditableText
                              pageSlug="regional-centers"
                              sectionKey="service-2"
                              defaultContent="Weekly swim lessons"
                              as="span"
                            >
                              {getContent(content, 'service-2', 'Weekly swim lessons')}
                            </EditableText>
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            <EditableText
                              pageSlug="regional-centers"
                              sectionKey="service-3"
                              defaultContent="Progress tracking"
                              as="span"
                            >
                              {getContent(content, 'service-3', 'Progress tracking')}
                            </EditableText>
                          </li>
                        </ul>
                      </div>

                      {/* Eligibility */}
                      <div>
                        <EditableText
                          pageSlug="regional-centers"
                          sectionKey="eligibility-title"
                          defaultContent="Eligibility"
                          as="h3"
                          className="font-semibold text-slate-800 mb-3"
                        >
                          {getContent(content, 'eligibility-title', 'Eligibility')}
                        </EditableText>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            {rc.short_name || rc.name} client
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            <EditableText
                              pageSlug="regional-centers"
                              sectionKey="eligibility-2"
                              defaultContent="Approved by coordinator"
                              as="span"
                            >
                              {getContent(content, 'eligibility-2', 'Approved by coordinator')}
                            </EditableText>
                          </li>
                          <li className="flex items-center gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                            <EditableText
                              pageSlug="regional-centers"
                              sectionKey="eligibility-3"
                              defaultContent="Purchase Order required"
                              as="span"
                            >
                              {getContent(content, 'eligibility-3', 'Purchase Order required')}
                            </EditableText>
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
          <EditableText
            pageSlug="regional-centers"
            sectionKey="how-to-title"
            defaultContent="How to Get Started"
            as="h2"
            className="text-3xl font-bold text-center mb-12"
          >
            {getContent(content, 'how-to-title', 'How to Get Started')}
          </EditableText>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">1</span>
              </div>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-1-title"
                defaultContent="Contact Your Coordinator"
                as="h3"
                className="font-semibold mb-2"
              >
                {getContent(content, 'step-1-title', 'Contact Your Coordinator')}
              </EditableText>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-1-description"
                defaultContent="Reach out to your Regional Center coordinator to request swim lessons as a service."
                as="p"
                className="text-gray-600 text-sm"
              >
                {getContent(content, 'step-1-description', 'Reach out to your Regional Center coordinator to request swim lessons as a service.')}
              </EditableText>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">2</span>
              </div>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-2-title"
                defaultContent="Get Approved"
                as="h3"
                className="font-semibold mb-2"
              >
                {getContent(content, 'step-2-title', 'Get Approved')}
              </EditableText>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-2-description"
                defaultContent="Once approved, your coordinator will issue a Purchase Order for swim services."
                as="p"
                className="text-gray-600 text-sm"
              >
                {getContent(content, 'step-2-description', 'Once approved, your coordinator will issue a Purchase Order for swim services.')}
              </EditableText>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-cyan-600">3</span>
              </div>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-3-title"
                defaultContent="Start Swimming"
                as="h3"
                className="font-semibold mb-2"
              >
                {getContent(content, 'step-3-title', 'Start Swimming')}
              </EditableText>
              <EditableText
                pageSlug="regional-centers"
                sectionKey="step-3-description"
                defaultContent="Contact us with your PO number and we'll schedule your assessment!"
                as="p"
                className="text-gray-600 text-sm"
              >
                {getContent(content, 'step-3-description', "Contact us with your PO number and we'll schedule your assessment!")}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            pageSlug="regional-centers"
            sectionKey="cta-title"
            defaultContent="Client of a Regional Center or Self Determination Program?"
            as="h2"
            className="text-3xl font-bold text-white mb-4"
          >
            {getContent(content, 'cta-title', 'Client of a Regional Center or Self Determination Program?')}
          </EditableText>
          <EditableText
            pageSlug="regional-centers"
            sectionKey="cta-description"
            defaultContent="If you're a client of VMRC, CVRC, or another Regional Center or Self Determination program, you may qualify for fully funded swim lessons. Request a referral to get started!"
            as="p"
            className="text-cyan-100 mb-8 max-w-xl mx-auto"
          >
            {getContent(content, 'cta-description', "If you're a client of VMRC, CVRC, or another Regional Center or Self Determination program, you may qualify for fully funded swim lessons. Request a referral to get started!")}
          </EditableText>
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
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white font-semibold hover:bg-white hover:text-cyan-700 px-8"
              >
                Questions? Email Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}