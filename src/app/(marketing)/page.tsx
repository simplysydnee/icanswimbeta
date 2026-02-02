'use client';

import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';
import { useEditMode } from '@/contexts/EditModeContext';

export default function Home() {
  const { editMode } = useEditMode();
  const { data: content, isLoading } = usePageContent('home', editMode);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <EditableText
              pageSlug="home"
              sectionKey="hero-title"
              defaultContent="I Can Swim"
              as="h1"
              className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-2"
            >
              {getContent(content, 'hero-title', 'I Can Swim')}
            </EditableText>
            <div className="w-full max-w-lg mx-auto mb-4">
              <svg
                viewBox="0 0 120 8"
                fill="none"
                className="w-full h-4 lg:h-6"
                preserveAspectRatio="none"
              >
                <mask id="taperMask">
                  <linearGradient id="taperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="15%" stopColor="white" stopOpacity="1" />
                    <stop offset="85%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <rect x="0" y="0" width="120" height="8" fill="url(#taperGradient)" />
                </mask>
                <path
                  d="M0,4 C20,1 40,1 60,4 C80,7 100,7 120,4"
                  stroke="url(#waveGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  mask="url(#taperMask)"
                />
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a5e84" />
                    <stop offset="100%" stopColor="#23a1c0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <EditableText
              pageSlug="home"
              sectionKey="hero-subtitle"
              defaultContent="Adaptive Swim Lessons"
              as="p"
              className="text-xl lg:text-2xl text-gray-600 font-inter mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {getContent(content, 'hero-subtitle', 'Adaptive Swim Lessons')}
            </EditableText>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/enroll" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Get Started
              </a>
              <a href="/about" className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-swimmers"
                defaultContent="300+"
                as="div"
                className="text-3xl font-bold text-[#1E3A5F] font-playfair-display"
              >
                {getContent(content, 'trust-badges-swimmers', '300+')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-swimmers-label"
                defaultContent="Swimmers Served"
                as="div"
                className="text-gray-600 font-inter"
              >
                {getContent(content, 'trust-badges-swimmers-label', 'Swimmers Served')}
              </EditableText>
            </div>
            <div className="space-y-2">
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-experience"
                defaultContent="15+"
                as="div"
                className="text-3xl font-bold text-[#1E3A5F] font-playfair-display"
              >
                {getContent(content, 'trust-badges-experience', '15+')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-experience-label"
                defaultContent="Years Experience"
                as="div"
                className="text-gray-600 font-inter"
              >
                {getContent(content, 'trust-badges-experience-label', 'Years Experience')}
              </EditableText>
            </div>
            <div className="space-y-2">
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-satisfaction"
                defaultContent="98%"
                as="div"
                className="text-3xl font-bold text-[#1E3A5F] font-playfair-display"
              >
                {getContent(content, 'trust-badges-satisfaction', '98%')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="trust-badges-satisfaction-label"
                defaultContent="Parent Satisfaction"
                as="div"
                className="text-gray-600 font-inter"
              >
                {getContent(content, 'trust-badges-satisfaction-label', 'Parent Satisfaction')}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <EditableText
              pageSlug="home"
              sectionKey="how-it-works-title"
              defaultContent="How It Works"
              as="h2"
              className="text-4xl font-bold text-[#1E3A5F] font-playfair-display mb-4"
            >
              {getContent(content, 'how-it-works-title', 'How It Works')}
            </EditableText>
            <EditableText
              pageSlug="home"
              sectionKey="how-it-works-description"
              defaultContent="Simple, safe, and effective swim lessons designed specifically for individuals with special needs"
              as="p"
              className="text-xl text-gray-600 font-inter max-w-2xl mx-auto"
            >
              {getContent(content, 'how-it-works-description', 'Simple, safe, and effective swim lessons designed specifically for individuals with special needs')}
            </EditableText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <EditableText
                pageSlug="home"
                sectionKey="step-1-number"
                defaultContent="1"
                as="div"
                className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto"
              >
                {getContent(content, 'step-1-number', '1')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-1-title"
                defaultContent="Initial Assessment"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'step-1-title', 'Initial Assessment')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-1-description"
                defaultContent="We evaluate each swimmer's comfort level and swimming abilities to create a personalized lesson plan"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'step-1-description', "We evaluate each swimmer's comfort level and swimming abilities to create a personalized lesson plan")}
              </EditableText>
            </div>
            <div className="text-center space-y-4">
              <EditableText
                pageSlug="home"
                sectionKey="step-2-number"
                defaultContent="2"
                as="div"
                className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto"
              >
                {getContent(content, 'step-2-number', '2')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-2-title"
                defaultContent="Personalized Lessons"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'step-2-title', 'Personalized Lessons')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-2-description"
                defaultContent="One-on-one instruction tailored to each individual's unique needs and learning style"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'step-2-description', "One-on-one instruction tailored to each individual's unique needs and learning style")}
              </EditableText>
            </div>
            <div className="text-center space-y-4">
              <EditableText
                pageSlug="home"
                sectionKey="step-3-number"
                defaultContent="3"
                as="div"
                className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto"
              >
                {getContent(content, 'step-3-number', '3')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-3-title"
                defaultContent="Progress Tracking"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'step-3-title', 'Progress Tracking')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="step-3-description"
                defaultContent="Regular updates on each swimmer's achievements and skill development"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'step-3-description', "Regular updates on each swimmer's achievements and skill development")}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <EditableText
              pageSlug="home"
              sectionKey="why-choose-us-title"
              defaultContent="Why Choose I Can Swim"
              as="h2"
              className="text-4xl font-bold text-[#1E3A5F] font-playfair-display mb-4"
            >
              {getContent(content, 'why-choose-us-title', 'Why Choose I Can Swim')}
            </EditableText>
            <EditableText
              pageSlug="home"
              sectionKey="why-choose-us-description"
              defaultContent="The experts you can trust with each swimmer's swimming journey"
              as="p"
              className="text-xl text-gray-600 font-inter max-w-2xl mx-auto"
            >
              {getContent(content, 'why-choose-us-description', "The experts you can trust with each swimmer's swimming journey")}
            </EditableText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-1-title"
                defaultContent="Specialized Expertise"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-1-title', 'Specialized Expertise')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-1-description"
                defaultContent="Our instructors are trained in adaptive swim techniques for individuals with autism, Down syndrome, and other special needs"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-1-description', 'Our instructors are trained in adaptive swim techniques for individuals with autism, Down syndrome, and other special needs')}
              </EditableText>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-2-title"
                defaultContent="Funding Approved"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-2-title', 'Funding Approved')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-2-description"
                defaultContent="We work directly with regional centers and funding sources to provide swim lessons for eligible individuals"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-2-description', 'We work directly with regional centers and funding sources to provide swim lessons for eligible individuals')}
              </EditableText>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-3-title"
                defaultContent="Safety First Approach"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-3-title', 'Safety First Approach')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-3-description"
                defaultContent="Certified lifeguards with specialized safety protocols and certifications ensure each swimmer's wellbeing in and around the water"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-3-description', "Certified lifeguards with specialized safety protocols and certifications ensure each swimmer's wellbeing in and around the water")}
              </EditableText>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-4-title"
                defaultContent="Individualized Attention"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-4-title', 'Individualized Attention')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-4-description"
                defaultContent="One-on-one instruction allows us to focus on each swimmer's specific goals and comfort level"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-4-description', "One-on-one instruction allows us to focus on each swimmer's specific goals and comfort level")}
              </EditableText>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-5-title"
                defaultContent="Proven Results"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-5-title', 'Proven Results')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-5-description"
                defaultContent="Track record of helping swimmers build confidence, improve coordination, and develop essential water safety skills"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-5-description', 'Track record of helping swimmers build confidence, improve coordination, and develop essential water safety skills')}
              </EditableText>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <EditableText
                pageSlug="home"
                sectionKey="feature-6-title"
                defaultContent="Flexible Scheduling"
                as="h3"
                className="text-xl font-semibold text-[#1E3A5F] font-inter"
              >
                {getContent(content, 'feature-6-title', 'Flexible Scheduling')}
              </EditableText>
              <EditableText
                pageSlug="home"
                sectionKey="feature-6-description"
                defaultContent="Convenient location in Modesto with flexible scheduling to fit your family's needs"
                as="p"
                className="text-gray-600 font-inter leading-relaxed"
              >
                {getContent(content, 'feature-6-description', "Convenient location in Modesto with flexible scheduling to fit your family's needs")}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#1E3A5F]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <EditableText
              pageSlug="home"
              sectionKey="cta-title"
              defaultContent="Ready to Start Your Swimming Journey?"
              as="h2"
              className="text-4xl font-bold text-white font-playfair-display mb-6"
            >
              {getContent(content, 'cta-title', 'Ready to Start Your Swimming Journey?')}
            </EditableText>
            <EditableText
              pageSlug="home"
              sectionKey="cta-description"
              defaultContent="Join hundreds of families who trust I Can Swim with their swimmer's water safety and swimming development"
              as="p"
              className="text-xl text-gray-200 font-inter mb-8 max-w-2xl mx-auto"
            >
              {getContent(content, 'cta-description', "Join hundreds of families who trust I Can Swim with their swimmer's water safety and swimming development")}
            </EditableText>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/enroll" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Get Started
              </a>
              <a href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-gray-800 font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}