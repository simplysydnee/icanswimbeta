'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';
import { useEditMode } from '@/contexts/EditModeContext';

export default function ProgramsPage() {
  const { editMode } = useEditMode();
  const { data: content, isLoading } = usePageContent('programs', editMode);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Section 1: Hero */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <EditableText
            pageSlug="programs"
            sectionKey="hero-title"
            defaultContent="Our Programs"
            as="h1"
            className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4"
          >
            {getContent(content, 'hero-title', 'Our Programs')}
          </EditableText>
          <EditableText
            pageSlug="programs"
            sectionKey="hero-subtitle"
            defaultContent="A personalized approach to water safety and confidence for swimmers of all abilities"
            as="p"
            className="text-xl text-gray-600 font-inter max-w-3xl mx-auto"
          >
            {getContent(content, 'hero-subtitle', 'A personalized approach to water safety and confidence for swimmers of all abilities')}
          </EditableText>
        </div>
      </div>

      {/* Section 2: The Journey (3 Steps) */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <EditableText
            pageSlug="programs"
            sectionKey="journey-title"
            defaultContent="Your Swim Journey"
            as="h2"
            className="text-3xl font-bold text-center mb-12"
          >
            {getContent(content, 'journey-title', 'Your Swim Journey')}
          </EditableText>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">1</span>
              </div>
              <EditableText
                pageSlug="programs"
                sectionKey="step-1-title"
                defaultContent="Initial Assessment"
                as="h3"
                className="text-xl font-semibold mb-3"
              >
                {getContent(content, 'step-1-title', 'Initial Assessment')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="step-1-description"
                defaultContent="A 30-minute evaluation where we assess water comfort, communication style, physical abilities, and individual needs to understand each swimmer's starting point."
                as="p"
                className="text-gray-600"
              >
                {getContent(content, 'step-1-description', "A 30-minute evaluation where we assess water comfort, communication style, physical abilities, and individual needs to understand each swimmer's starting point.")}
              </EditableText>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">2</span>
              </div>
              <EditableText
                pageSlug="programs"
                sectionKey="step-2-title"
                defaultContent="Personalized Program"
                as="h3"
                className="text-xl font-semibold mb-3"
              >
                {getContent(content, 'step-2-title', 'Personalized Program')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="step-2-description"
                defaultContent="Based on the assessment, we design a customized lesson plan tailored to each swimmer's unique needs, learning style, and goals."
                as="p"
                className="text-gray-600"
              >
                {getContent(content, 'step-2-description', "Based on the assessment, we design a customized lesson plan tailored to each swimmer's unique needs, learning style, and goals.")}
              </EditableText>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">3</span>
              </div>
              <EditableText
                pageSlug="programs"
                sectionKey="step-3-title"
                defaultContent="Progressive Skill Building"
                as="h3"
                className="text-xl font-semibold mb-3"
              >
                {getContent(content, 'step-3-title', 'Progressive Skill Building')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="step-3-description"
                defaultContent="Swimmers advance through our level system at their own pace, building confidence and celebrating milestones along the way."
                as="p"
                className="text-gray-600"
              >
                {getContent(content, 'step-3-description', 'Swimmers advance through our level system at their own pace, building confidence and celebrating milestones along the way.')}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Swim Levels (Color-Coded Cards) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <EditableText
            pageSlug="programs"
            sectionKey="levels-title"
            defaultContent="Our Swim Levels"
            as="h2"
            className="text-3xl font-bold text-center mb-4"
          >
            {getContent(content, 'levels-title', 'Our Swim Levels')}
          </EditableText>
          <EditableText
            pageSlug="programs"
            sectionKey="levels-subtitle"
            defaultContent="Our progressive level system guides swimmers from water introduction to advanced skills"
            as="p"
            className="text-gray-600 text-center mb-12 max-w-2xl mx-auto"
          >
            {getContent(content, 'levels-subtitle', 'Our progressive level system guides swimmers from water introduction to advanced skills')}
          </EditableText>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* White Level */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-full mx-auto mb-3"></div>
              <EditableText
                pageSlug="programs"
                sectionKey="level-white-title"
                defaultContent="White"
                as="h3"
                className="font-bold text-gray-800 mb-2"
              >
                {getContent(content, 'level-white-title', 'White')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="level-white-description"
                defaultContent="Water Introduction & Comfort"
                as="p"
                className="text-sm text-gray-600"
              >
                {getContent(content, 'level-white-description', 'Water Introduction & Comfort')}
              </EditableText>
            </div>

            {/* Yellow Level */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-3"></div>
              <EditableText
                pageSlug="programs"
                sectionKey="level-yellow-title"
                defaultContent="Yellow"
                as="h3"
                className="font-bold text-yellow-800 mb-2"
              >
                {getContent(content, 'level-yellow-title', 'Yellow')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="level-yellow-description"
                defaultContent="Basic Water Safety & Floating"
                as="p"
                className="text-sm text-yellow-700"
              >
                {getContent(content, 'level-yellow-description', 'Basic Water Safety & Floating')}
              </EditableText>
            </div>

            {/* Orange Level */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-400 rounded-full mx-auto mb-3"></div>
              <EditableText
                pageSlug="programs"
                sectionKey="level-orange-title"
                defaultContent="Orange"
                as="h3"
                className="font-bold text-orange-800 mb-2"
              >
                {getContent(content, 'level-orange-title', 'Orange')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="level-orange-description"
                defaultContent="Foundational Swim Skills"
                as="p"
                className="text-sm text-orange-700"
              >
                {getContent(content, 'level-orange-description', 'Foundational Swim Skills')}
              </EditableText>
            </div>

            {/* Green Level */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3"></div>
              <EditableText
                pageSlug="programs"
                sectionKey="level-green-title"
                defaultContent="Green"
                as="h3"
                className="font-bold text-green-800 mb-2"
              >
                {getContent(content, 'level-green-title', 'Green')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="level-green-description"
                defaultContent="Stroke Development"
                as="p"
                className="text-sm text-green-700"
              >
                {getContent(content, 'level-green-description', 'Stroke Development')}
              </EditableText>
            </div>

            {/* Blue Level */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3"></div>
              <EditableText
                pageSlug="programs"
                sectionKey="level-blue-title"
                defaultContent="Blue"
                as="h3"
                className="font-bold text-blue-800 mb-2"
              >
                {getContent(content, 'level-blue-title', 'Blue')}
              </EditableText>
              <EditableText
                pageSlug="programs"
                sectionKey="level-blue-description"
                defaultContent="Advanced Skills & Endurance"
                as="p"
                className="text-sm text-blue-700"
              >
                {getContent(content, 'level-blue-description', 'Advanced Skills & Endurance')}
              </EditableText>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What Makes Us Different */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <EditableText
            pageSlug="programs"
            sectionKey="different-title"
            defaultContent="What Makes Us Different"
            as="h2"
            className="text-3xl font-bold text-center mb-12"
          >
            {getContent(content, 'different-title', 'What Makes Us Different')}
          </EditableText>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-1-title"
                  defaultContent="Individualized Attention"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-1-title', 'Individualized Attention')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-1-description"
                  defaultContent="Personalized instruction tailored to each swimmer's unique needs and pace"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-1-description', "Personalized instruction tailored to each swimmer's unique needs and pace")}
                </EditableText>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-2-title"
                  defaultContent="Adaptive Techniques"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-2-title', 'Adaptive Techniques')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-2-description"
                  defaultContent="Specialized methods for swimmers of all abilities and learning styles"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-2-description', 'Specialized methods for swimmers of all abilities and learning styles')}
                </EditableText>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-3-title"
                  defaultContent="Consistent Instructors"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-3-title', 'Consistent Instructors')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-3-description"
                  defaultContent="Build trust and rapport with the same instructor each lesson"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-3-description', 'Build trust and rapport with the same instructor each lesson')}
                </EditableText>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-4-title"
                  defaultContent="Progress Tracking"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-4-title', 'Progress Tracking')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-4-description"
                  defaultContent="Regular updates and milestone celebrations to keep you informed"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-4-description', 'Regular updates and milestone celebrations to keep you informed')}
                </EditableText>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-5-title"
                  defaultContent="Swim Angelfish Certified"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-5-title', 'Swim Angelfish Certified')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-5-description"
                  defaultContent="Trained through the leading adaptive aquatics program, plus CPR/First Aid certified"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-5-description', 'Trained through the leading adaptive aquatics program, plus CPR/First Aid certified')}
                </EditableText>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-6-title"
                  defaultContent="Family Communication"
                  as="h3"
                  className="font-semibold mb-1"
                >
                  {getContent(content, 'different-6-title', 'Family Communication')}
                </EditableText>
                <EditableText
                  pageSlug="programs"
                  sectionKey="different-6-description"
                  defaultContent="Clear updates after each lesson so you're always in the loop"
                  as="p"
                  className="text-gray-600 text-sm"
                >
                  {getContent(content, 'different-6-description', "Clear updates after each lesson so you're always in the loop")}
                </EditableText>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="py-16 bg-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            pageSlug="programs"
            sectionKey="cta-title"
            defaultContent="Ready to Start?"
            as="h2"
            className="text-3xl font-bold text-white mb-4"
          >
            {getContent(content, 'cta-title', 'Ready to Start?')}
          </EditableText>
          <EditableText
            pageSlug="programs"
            sectionKey="cta-description"
            defaultContent="Every swimmer begins with an assessment. Let's find the right program for you."
            as="p"
            className="text-cyan-100 mb-8 max-w-xl mx-auto"
          >
            {getContent(content, 'cta-description', "Every swimmer begins with an assessment. Let's find the right program for you.")}
          </EditableText>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary Button - WHITE background for contrast */}
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-cyan-700 font-semibold hover:bg-gray-100 shadow-lg px-8"
              >
                Get Started
              </Button>
            </Link>

            {/* Secondary Button - White outline with thick border */}
            <Link href="/regional-centers">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white font-semibold hover:bg-white hover:text-cyan-700 px-8"
              >
                Learn About Funding
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}