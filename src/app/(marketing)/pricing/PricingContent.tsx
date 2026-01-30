'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, CreditCard, Shield } from 'lucide-react';
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';

interface PricingContentProps {
  regionalCenterNames: string[];
}

export default function PricingContent({ regionalCenterNames }: PricingContentProps) {
  const { data: content, isLoading } = usePageContent('pricing');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            pageSlug="pricing"
            sectionKey="hero-title"
            defaultContent="Pricing"
            as="h1"
            className="text-4xl md:text-5xl font-bold text-cyan-600 mb-4"
          >
            {getContent(content, 'hero-title', 'Pricing')}
          </EditableText>
          <EditableText
            pageSlug="pricing"
            sectionKey="hero-subtitle"
            defaultContent="Transparent pricing for adaptive swim lessons"
            as="p"
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            {getContent(content, 'hero-subtitle', 'Transparent pricing for adaptive swim lessons')}
          </EditableText>
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
                <EditableText
                  pageSlug="pricing"
                  sectionKey="private-pay-title"
                  defaultContent="Private Pay"
                  as="h3"
                  className="text-2xl font-bold text-center mb-6"
                >
                  {getContent(content, 'private-pay-title', 'Private Pay')}
                </EditableText>

                {/* Two price rows */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="assessment-label"
                      defaultContent="Initial Assessment (Required)"
                      as="p"
                      className="text-sm text-gray-500 mb-1"
                    >
                      {getContent(content, 'assessment-label', 'Initial Assessment (Required)')}
                    </EditableText>
                    <div>
                      <EditableText
                        pageSlug="pricing"
                        sectionKey="assessment-price"
                        defaultContent="$175"
                        as="span"
                        className="text-3xl font-bold"
                      >
                        {getContent(content, 'assessment-price', '$175')}
                      </EditableText>
                      <EditableText
                        pageSlug="pricing"
                        sectionKey="assessment-frequency"
                        defaultContent="one-time"
                        as="span"
                        className="text-gray-500 ml-1"
                      >
                        {getContent(content, 'assessment-frequency', 'one-time')}
                      </EditableText>
                    </div>
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="assessment-duration"
                      defaultContent="30-minute evaluation"
                      as="p"
                      className="text-xs text-gray-400 mt-1"
                    >
                      {getContent(content, 'assessment-duration', '30-minute evaluation')}
                    </EditableText>
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4 text-center border-2 border-cyan-200">
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="lessons-label"
                      defaultContent="Weekly Lessons"
                      as="p"
                      className="text-sm text-gray-500 mb-1"
                    >
                      {getContent(content, 'lessons-label', 'Weekly Lessons')}
                    </EditableText>
                    <div>
                      <EditableText
                        pageSlug="pricing"
                        sectionKey="lessons-price"
                        defaultContent="$90"
                        as="span"
                        className="text-3xl font-bold text-cyan-600"
                      >
                        {getContent(content, 'lessons-price', '$90')}
                      </EditableText>
                      <EditableText
                        pageSlug="pricing"
                        sectionKey="lessons-frequency"
                        defaultContent="per session"
                        as="span"
                        className="text-gray-500 ml-1"
                      >
                        {getContent(content, 'lessons-frequency', 'per session')}
                      </EditableText>
                    </div>
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="lessons-duration"
                      defaultContent="30-minute one-on-one instruction"
                      as="p"
                      className="text-xs text-gray-400 mt-1"
                    >
                      {getContent(content, 'lessons-duration', '30-minute one-on-one instruction')}
                    </EditableText>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="private-benefit-1"
                      defaultContent="Comprehensive skill evaluation"
                      as="span"
                    >
                      {getContent(content, 'private-benefit-1', 'Comprehensive skill evaluation')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="private-benefit-2"
                      defaultContent="Personalized lesson plan"
                      as="span"
                    >
                      {getContent(content, 'private-benefit-2', 'Personalized lesson plan')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="private-benefit-3"
                      defaultContent="Consistent instructor"
                      as="span"
                    >
                      {getContent(content, 'private-benefit-3', 'Consistent instructor')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="private-benefit-4"
                      defaultContent="Flexible scheduling"
                      as="span"
                    >
                      {getContent(content, 'private-benefit-4', 'Flexible scheduling')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="private-benefit-5"
                      defaultContent="Progress tracking & reports"
                      as="span"
                    >
                      {getContent(content, 'private-benefit-5', 'Progress tracking & reports')}
                    </EditableText>
                  </li>
                </ul>
              </div>

              <Link href="/contact" className="w-full">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Get Started
                </Button>
              </Link>
            </Card>

            {/* Funding Programs Card - Most Popular */}
            <Card className="p-8 flex flex-col bg-gradient-to-br from-green-50 to-cyan-50 border-2 border-green-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-medium px-4 py-1 rounded-full">
                <EditableText
                  pageSlug="pricing"
                  sectionKey="popular-badge"
                  defaultContent="Most Popular"
                  as="span"
                >
                  {getContent(content, 'popular-badge', 'Most Popular')}
                </EditableText>
              </div>

              <div className="flex-1">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-green-600" />
                </div>
                <EditableText
                  pageSlug="pricing"
                  sectionKey="funding-title"
                  defaultContent="Program Funded"
                  as="h3"
                  className="text-2xl font-bold text-center mb-6"
                >
                  {getContent(content, 'funding-title', 'Program Funded')}
                </EditableText>

                {/* Price display */}
                <div className="text-center mb-6">
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-price"
                      defaultContent="$0"
                      as="span"
                      className="text-4xl font-bold text-green-600"
                    >
                      {getContent(content, 'funding-price', '$0')}
                    </EditableText>
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-subtitle"
                      defaultContent="for eligible families"
                      as="span"
                      className="text-gray-500 ml-2"
                    >
                      {getContent(content, 'funding-subtitle', 'for eligible families')}
                    </EditableText>
                  </div>
                  <EditableText
                    pageSlug="pricing"
                    sectionKey="funding-description"
                    defaultContent="Fully funded through Regional Centers or Self Determination programs"
                    as="p"
                    className="text-sm text-gray-600 mt-3"
                  >
                    {getContent(content, 'funding-description', 'Fully funded through Regional Centers or Self Determination programs')}
                  </EditableText>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-benefit-1"
                      defaultContent="Same quality instruction"
                      as="span"
                    >
                      {getContent(content, 'funding-benefit-1', 'Same quality instruction')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-benefit-2"
                      defaultContent="No out-of-pocket cost"
                      as="span"
                    >
                      {getContent(content, 'funding-benefit-2', 'No out-of-pocket cost')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-benefit-3"
                      defaultContent="We handle all paperwork"
                      as="span"
                    >
                      {getContent(content, 'funding-benefit-3', 'We handle all paperwork')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <EditableText
                      pageSlug="pricing"
                      sectionKey="funding-benefit-4"
                      defaultContent="Assessment included"
                      as="span"
                    >
                      {getContent(content, 'funding-benefit-4', 'Assessment included')}
                    </EditableText>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><EditableText
                      pageSlug="pricing"
                      sectionKey="vendor-prefix"
                      defaultContent="Vendor for: "
                      as="span"
                    >
                      {getContent(content, 'vendor-prefix', 'Vendor for: ')}
                    </EditableText>{regionalCenterNames.join(', ')}</span>
                  </li>
                </ul>
              </div>

              <Link href="/regional-centers" className="w-full">
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                  View Funding Programs
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            pageSlug="pricing"
            sectionKey="faq-title"
            defaultContent="Not Sure Which Option?"
            as="h2"
            className="text-2xl font-bold mb-4"
          >
            {getContent(content, 'faq-title', 'Not Sure Which Option?')}
          </EditableText>
          <EditableText
            pageSlug="pricing"
            sectionKey="faq-description"
            defaultContent="If you're a client of a Regional Center or Self Determination program, you may qualify for fully funded lessons. Contact your coordinator to find out!"
            as="p"
            className="text-gray-600 mb-6 max-w-xl mx-auto"
          >
            {getContent(content, 'faq-description', "If you're a client of a Regional Center or Self Determination program, you may qualify for fully funded lessons. Contact your coordinator to find out!")}
          </EditableText>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/regional-centers">
              <Button variant="outline">
                Check Funding Eligibility
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
          <EditableText
            pageSlug="pricing"
            sectionKey="payment-options-title"
            defaultContent="Payment Options"
            as="h2"
            className="text-3xl font-bold text-gray-900 text-center mb-8"
          >
            {getContent(content, 'payment-options-title', 'Payment Options')}
          </EditableText>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center border">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <EditableText
                pageSlug="pricing"
                sectionKey="payment-option-1-title"
                defaultContent="Credit/Debit Card"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'payment-option-1-title', 'Credit/Debit Card')}
              </EditableText>
              <EditableText
                pageSlug="pricing"
                sectionKey="payment-option-1-description"
                defaultContent="Pay invoices securely online"
                as="p"
                className="text-gray-600 text-sm"
              >
                {getContent(content, 'payment-option-1-description', 'Pay invoices securely online')}
              </EditableText>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <EditableText
                pageSlug="pricing"
                sectionKey="payment-option-2-title"
                defaultContent="Funding Programs"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'payment-option-2-title', 'Funding Programs')}
              </EditableText>
              <EditableText
                pageSlug="pricing"
                sectionKey="payment-option-2-description"
                defaultContent="No cost for eligible families (Regional Centers & Self Determination)"
                as="p"
                className="text-gray-600 text-sm"
              >
                {getContent(content, 'payment-option-2-description', 'No cost for eligible families (Regional Centers & Self Determination)')}
              </EditableText>
            </div>
          </div>
          <EditableText
            pageSlug="pricing"
            sectionKey="payment-note"
            defaultContent="Private pay clients receive invoices after each session. Payments can be made online via credit/debit card."
            as="p"
            className="text-center text-gray-500 text-sm mt-6 max-w-xl mx-auto"
          >
            {getContent(content, 'payment-note', 'Private pay clients receive invoices after each session. Payments can be made online via credit/debit card.')}
          </EditableText>
        </div>
      </section>
    </div>
  );
}