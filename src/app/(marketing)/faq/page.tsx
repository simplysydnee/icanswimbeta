'use client';

import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';

export default function FAQPage() {
  const { data: content, isLoading } = usePageContent('faq');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  const faqs = [
    {
      question: getContent(content, 'faq-1-question', "How do I get started with swim lessons?"),
      answer: getContent(content, 'faq-1-answer', "Start by booking an assessment session. This 30-minute session helps us understand your swimmer's comfort level, abilities, and goals. After the assessment, we'll create a personalized lesson plan and schedule your regular lessons.")
    },
    {
      question: getContent(content, 'faq-2-question', "What should we bring to the first lesson?"),
      answer: getContent(content, 'faq-2-answer', "Please bring a swimsuit, towel, and any necessary swim aids (goggles, swim cap, etc.). We provide all equipment including floatation devices and teaching aids. We also have private changing areas available.")
    },
    {
      question: getContent(content, 'faq-3-question', "Do you accept regional center funding?"),
      answer: getContent(content, 'faq-3-answer', "Yes! We work with Valley Mountain Regional Center (VMRC) and Central Valley Regional Center (CVRC) to provide fully funded swim lessons for eligible children. We also accept private pay. We do not accept insurance.")
    },
    {
      question: getContent(content, 'faq-4-question', "What is your cancellation policy?"),
      answer: getContent(content, 'faq-4-answer', "We require 24-hour notice for cancellations. Late cancellations (less than 24 hours) may result in being charged for the session. In case of illness or emergency, please contact us as soon as possible to discuss options.")
    },
    {
      question: getContent(content, 'faq-5-question', "How long are the lessons?"),
      answer: getContent(content, 'faq-5-answer', "Assessment sessions are 30 minutes. Regular lessons are 30 minutes of one-on-one instruction. We find this duration is optimal for maintaining focus and making consistent progress.")
    },
    {
      question: getContent(content, 'faq-6-question', "What qualifications do your instructors have?"),
      answer: getContent(content, 'faq-6-answer', "All our instructors are certified in adaptive aquatics, CPR, First Aid, and water safety. They undergo regular training in the latest teaching methodologies and special needs education. Many have additional certifications in areas like autism spectrum disorders and sensory processing.")
    },
    {
      question: getContent(content, 'faq-7-question', "Can parents watch the lessons?"),
      answer: getContent(content, 'faq-7-answer', "Yes! We have observation areas where parents can watch lessons. For some swimmers, we may recommend starting with parents nearby for comfort, then gradually increasing independence as the swimmer becomes more comfortable.")
    },
    {
      question: getContent(content, 'faq-8-question', "What if my child has specific medical needs?"),
      answer: getContent(content, 'faq-8-answer', "We work closely with families to understand any medical conditions, allergies, or special needs. Our instructors are trained to accommodate various medical needs and we maintain emergency action plans for each swimmer.")
    },
    {
      question: getContent(content, 'faq-9-question', "How do you handle swimmers who are afraid of water?"),
      answer: getContent(content, 'faq-9-answer', "We use a gentle, gradual approach to build water confidence. We start with basic water exploration and play, gradually introducing new skills at the swimmer's pace. Our instructors are specially trained in working with water-anxious swimmers.")
    },
    {
      question: getContent(content, 'faq-10-question', "Do you offer make-up lessons?"),
      answer: getContent(content, 'faq-10-answer', "Yes, we offer make-up lessons for cancellations with 24-hour notice, subject to availability. Make-up lessons must be scheduled within 30 days of the missed lesson. We recommend scheduling make-ups as soon as possible.")
    },
    {
      question: getContent(content, 'faq-11-question', "What ages do you teach?"),
      answer: getContent(content, 'faq-11-answer', "We teach swimmers from 3 years old through adulthood. Our adaptive approach allows us to work with swimmers of all ages and ability levels.")
    },
    {
      question: getContent(content, 'faq-12-question', "How do you track progress?"),
      answer: getContent(content, 'faq-12-answer', "We use a comprehensive progress tracking system that includes regular skill assessments, written progress reports, and parent-instructor conferences. For regional center clients, we also provide progress reports to coordinators.")
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <EditableText
          pageSlug="faq"
          sectionKey="hero-title"
          defaultContent="Frequently Asked Questions"
          as="h1"
          className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4"
        >
          {getContent(content, 'hero-title', 'Frequently Asked Questions')}
        </EditableText>
        <EditableText
          pageSlug="faq"
          sectionKey="hero-subtitle"
          defaultContent="Find answers to common questions about our swim programs"
          as="p"
          className="text-xl text-gray-600 font-inter max-w-3xl mx-auto"
        >
          {getContent(content, 'hero-subtitle', 'Find answers to common questions about our swim programs')}
        </EditableText>
      </div>

      {/* FAQ Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <EditableText
                    pageSlug="faq"
                    sectionKey={`faq-${index + 1}-question`}
                    defaultContent={faq.question}
                    as="h3"
                    className="text-lg font-semibold text-gray-900 group-open:text-cyan-600"
                  >
                    {faq.question}
                  </EditableText>
                  <span className="flex-shrink-0 ml-4">
                    <svg className="w-5 h-5 text-gray-500 group-open:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <svg className="w-5 h-5 text-cyan-600 hidden group-open:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 text-gray-700">
                  <EditableText
                    pageSlug="faq"
                    sectionKey={`faq-${index + 1}-answer`}
                    defaultContent={faq.answer}
                    as="p"
                  >
                    {faq.answer}
                  </EditableText>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* Still Have Questions */}
      <div className="max-w-4xl mx-auto mt-16">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12 text-center">
          <EditableText
            pageSlug="faq"
            sectionKey="still-questions-title"
            defaultContent="Still Have Questions?"
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            {getContent(content, 'still-questions-title', 'Still Have Questions?')}
          </EditableText>
          <EditableText
            pageSlug="faq"
            sectionKey="still-questions-description"
            defaultContent="We're here to help! Contact us for more information or to schedule your assessment."
            as="p"
            className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
          >
            {getContent(content, 'still-questions-description', "We're here to help! Contact us for more information or to schedule your assessment.")}
          </EditableText>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/contact"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
            >
{getContent(content, 'contact-button-text', 'Contact Us')}
            </a>
            <a
              href="tel:2097787877"
              className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
            >
              Call: (209) 778-7877
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto mt-16">
        <EditableText
          pageSlug="faq"
          sectionKey="quick-links-title"
          defaultContent="Quick Links"
          as="h2"
          className="text-2xl font-bold text-gray-900 text-center mb-8"
        >
          {getContent(content, 'quick-links-title', 'Quick Links')}
        </EditableText>
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/programs"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-1-title"
              defaultContent="Our Programs"
              as="h3"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {getContent(content, 'quick-link-1-title', 'Our Programs')}
            </EditableText>
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-1-description"
              defaultContent="Learn about our swim lesson options"
              as="p"
              className="text-gray-600 text-sm"
            >
              {getContent(content, 'quick-link-1-description', 'Learn about our swim lesson options')}
            </EditableText>
          </a>
          <a
            href="/pricing"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-2-title"
              defaultContent="Pricing"
              as="h3"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {getContent(content, 'quick-link-2-title', 'Pricing')}
            </EditableText>
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-2-description"
              defaultContent="View our transparent pricing"
              as="p"
              className="text-gray-600 text-sm"
            >
              {getContent(content, 'quick-link-2-description', 'View our transparent pricing')}
            </EditableText>
          </a>
          <a
            href="/regional-centers"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-3-title"
              defaultContent="Funding"
              as="h3"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {getContent(content, 'quick-link-3-title', 'Funding')}
            </EditableText>
            <EditableText
              pageSlug="faq"
              sectionKey="quick-link-3-description"
              defaultContent="Learn about regional center funding"
              as="p"
              className="text-gray-600 text-sm"
            >
              {getContent(content, 'quick-link-3-description', 'Learn about regional center funding')}
            </EditableText>
          </a>
        </div>
      </div>
    </div>
  );
}