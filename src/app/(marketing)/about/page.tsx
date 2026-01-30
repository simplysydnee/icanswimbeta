'use client';

import Image from 'next/image';
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';

export default function AboutPage() {
  const { data: content, isLoading } = usePageContent('about');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <EditableText
            pageSlug="about"
            sectionKey="hero-title"
            defaultContent="About I Can Swim"
            as="h1"
            className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4"
          >
            {getContent(content, 'hero-title', 'About I Can Swim')}
          </EditableText>
          <EditableText
            pageSlug="about"
            sectionKey="hero-subtitle"
            defaultContent="Building confidence, safety, and joy in the water through personalized, adaptive instruction"
            as="p"
            className="text-xl text-gray-600 font-inter max-w-3xl mx-auto"
          >
            {getContent(content, 'hero-subtitle', 'Building confidence, safety, and joy in the water through personalized, adaptive instruction')}
          </EditableText>
        </div>

        {/* Mission Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
            <EditableText
              pageSlug="about"
              sectionKey="mission-title"
              defaultContent="Our Mission"
              as="h2"
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              {getContent(content, 'mission-title', 'Our Mission')}
            </EditableText>
            <EditableText
              pageSlug="about"
              sectionKey="mission-description"
              defaultContent="At I Can Swim, we believe every child deserves the opportunity to experience the joy and freedom of swimming. Our mission is to provide adaptive swim lessons that are tailored to each swimmer's unique needs, building not just swimming skills but also confidence, safety awareness, and a lifelong love for the water."
              as="p"
              className="text-lg text-gray-700 mb-6"
            >
              {getContent(content, 'mission-description', "At I Can Swim, we believe every child deserves the opportunity to experience the joy and freedom of swimming. Our mission is to provide adaptive swim lessons that are tailored to each swimmer's unique needs, building not just swimming skills but also confidence, safety awareness, and a lifelong love for the water.")}
            </EditableText>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-1-title"
                  defaultContent="Personalized Approach"
                  as="h3"
                  className="text-xl font-semibold text-cyan-700 mb-2"
                >
                  {getContent(content, 'feature-1-title', 'Personalized Approach')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-1-description"
                  defaultContent="Each lesson is customized to the swimmer's abilities, learning style, and comfort level in the water."
                  as="p"
                  className="text-gray-600"
                >
                  {getContent(content, 'feature-1-description', "Each lesson is customized to the swimmer's abilities, learning style, and comfort level in the water.")}
                </EditableText>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-2-title"
                  defaultContent="Safety First"
                  as="h3"
                  className="text-xl font-semibold text-cyan-700 mb-2"
                >
                  {getContent(content, 'feature-2-title', 'Safety First')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-2-description"
                  defaultContent="We prioritize water safety skills that can save lives, teaching swimmers how to be safe in and around water."
                  as="p"
                  className="text-gray-600"
                >
                  {getContent(content, 'feature-2-description', 'We prioritize water safety skills that can save lives, teaching swimmers how to be safe in and around water.')}
                </EditableText>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-3-title"
                  defaultContent="Inclusive Environment"
                  as="h3"
                  className="text-xl font-semibold text-cyan-700 mb-2"
                >
                  {getContent(content, 'feature-3-title', 'Inclusive Environment')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="feature-3-description"
                  defaultContent="Our program welcomes swimmers of all abilities, creating a supportive and encouraging learning environment."
                  as="p"
                  className="text-gray-600"
                >
                  {getContent(content, 'feature-3-description', 'Our program welcomes swimmers of all abilities, creating a supportive and encouraging learning environment.')}
                </EditableText>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <EditableText
            pageSlug="about"
            sectionKey="story-title"
            defaultContent="Our Story"
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            {getContent(content, 'story-title', 'Our Story')}
          </EditableText>
          <div className="prose prose-lg text-gray-700">
            <EditableText
              pageSlug="about"
              sectionKey="story-paragraph-1"
              defaultContent="Founded in 2024 by Sutton Lucas, I Can Swim began with a simple observation: many children with special needs were missing out on the life-changing benefits of swimming due to a lack of specialized instruction."
              as="p"
              className="mb-4"
            >
              {getContent(content, 'story-paragraph-1', 'Founded in 2024 by Sutton Lucas, I Can Swim began with a simple observation: many children with special needs were missing out on the life-changing benefits of swimming due to a lack of specialized instruction.')}
            </EditableText>
            <EditableText
              pageSlug="about"
              sectionKey="story-paragraph-2"
              defaultContent="What started as a small program serving families in the Central Valley is growing into a comprehensive swim school. Our success comes from our commitment to understanding each swimmer's unique needs and creating personalized learning paths that celebrate every achievement, no matter how small."
              as="p"
              className="mb-4"
            >
              {getContent(content, 'story-paragraph-2', "What started as a small program serving families in the Central Valley is growing into a comprehensive swim school. Our success comes from our commitment to understanding each swimmer's unique needs and creating personalized learning paths that celebrate every achievement, no matter how small.")}
            </EditableText>
            <EditableText
              pageSlug="about"
              sectionKey="story-paragraph-3"
              defaultContent="Today, we're proud to be a regional center vendor closely working with VMRC and CVRC (Central Valley Regional Center) to make adaptive swim lessons accessible to all families, regardless of their financial situation."
              as="p"
            >
              {getContent(content, 'story-paragraph-3', "Today, we're proud to be a regional center vendor closely working with VMRC and CVRC (Central Valley Regional Center) to make adaptive swim lessons accessible to all families, regardless of their financial situation.")}
            </EditableText>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <EditableText
            pageSlug="about"
            sectionKey="founder-section-title"
            defaultContent="Meet Our Founder"
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            {getContent(content, 'founder-section-title', 'Meet Our Founder')}
          </EditableText>
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl p-1">
                  <div className="bg-white rounded-lg p-4">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src="/images/sutton-lucas.jpg"
                        alt="Sutton Lucas"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-2/3">
                <EditableText
                  pageSlug="about"
                  sectionKey="founder-name"
                  defaultContent="Sutton Lucas"
                  as="h3"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {getContent(content, 'founder-name', 'Sutton Lucas')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="founder-title"
                  defaultContent="Owner & Lead Instructor"
                  as="p"
                  className="text-cyan-600 font-medium mb-4"
                >
                  {getContent(content, 'founder-title', 'Owner & Lead Instructor')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="founder-bio"
                  defaultContent={`Sutton has been teaching individuals with special needs for more than 14 years. She holds a Bachelor of Arts in Liberal Studies from Cal Poly San Luis Obispo, a Master's in Education, and three teaching credentials in Special Education. She is Level 2 Adaptive Swim Whisper certified from Swim Angelfish.`}
                  as="p"
                  className="text-gray-700 mb-4"
                >
                  {getContent(content, 'founder-bio', `Sutton has been teaching individuals with special needs for more than 14 years. She holds a Bachelor of Arts in Liberal Studies from Cal Poly San Luis Obispo, a Master's in Education, and three teaching credentials in Special Education. She is Level 2 Adaptive Swim Whisper certified from Swim Angelfish.`)}
                </EditableText>
                <div className="flex flex-wrap gap-2">
                  <EditableText
                    pageSlug="about"
                    sectionKey="founder-credential-1"
                    defaultContent="BA Liberal Studies, Cal Poly SLO"
                    as="span"
                    className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm"
                  >
                    {getContent(content, 'founder-credential-1', 'BA Liberal Studies, Cal Poly SLO')}
                  </EditableText>
                  <EditableText
                    pageSlug="about"
                    sectionKey="founder-credential-2"
                    defaultContent="MA Education"
                    as="span"
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {getContent(content, 'founder-credential-2', 'MA Education')}
                  </EditableText>
                  <EditableText
                    pageSlug="about"
                    sectionKey="founder-credential-3"
                    defaultContent="3 Special Education Credentials"
                    as="span"
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                  >
                    {getContent(content, 'founder-credential-3', '3 Special Education Credentials')}
                  </EditableText>
                  <EditableText
                    pageSlug="about"
                    sectionKey="founder-credential-4"
                    defaultContent="Level 2 Adaptive Swim Whisper"
                    as="span"
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {getContent(content, 'founder-credential-4', 'Level 2 Adaptive Swim Whisper')}
                  </EditableText>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="max-w-4xl mx-auto">
          <EditableText
            pageSlug="about"
            sectionKey="locations-title"
            defaultContent="Our Locations"
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            {getContent(content, 'locations-title', 'Our Locations')}
          </EditableText>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Modesto Location */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
              <EditableText
                pageSlug="about"
                sectionKey="modesto-title"
                defaultContent="Modesto"
                as="h3"
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                {getContent(content, 'modesto-title', 'Modesto')}
              </EditableText>
              <EditableText
                pageSlug="about"
                sectionKey="modesto-address"
                defaultContent="1212 Kansas Ave, Modesto, CA 95351"
                as="p"
                className="text-gray-700 mb-4"
              >
                {getContent(content, 'modesto-address', '1212 Kansas Ave, Modesto, CA 95351')}
              </EditableText>
              <EditableText
                pageSlug="about"
                sectionKey="modesto-description"
                defaultContent="Our lessons take place at quality facilities we rent for our swim program."
                as="p"
                className="text-gray-600 mb-4"
              >
                {getContent(content, 'modesto-description', 'Our lessons take place at quality facilities we rent for our swim program.')}
              </EditableText>
              <div className="space-y-2 text-gray-600">
                <EditableText
                  pageSlug="about"
                  sectionKey="modesto-feature-1"
                  defaultContent="• Heated indoor pool"
                  as="p"
                >
                  {getContent(content, 'modesto-feature-1', '• Heated indoor pool')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="modesto-feature-2"
                  defaultContent="• Private changing rooms"
                  as="p"
                >
                  {getContent(content, 'modesto-feature-2', '• Private changing rooms')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="modesto-feature-3"
                  defaultContent="• Sensory-friendly environment"
                  as="p"
                >
                  {getContent(content, 'modesto-feature-3', '• Sensory-friendly environment')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="modesto-feature-4"
                  defaultContent="• Observation area for parents"
                  as="p"
                >
                  {getContent(content, 'modesto-feature-4', '• Observation area for parents')}
                </EditableText>
              </div>
            </div>

            {/* Merced Location */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
              <EditableText
                pageSlug="about"
                sectionKey="merced-title"
                defaultContent="Merced"
                as="h3"
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                {getContent(content, 'merced-title', 'Merced')}
              </EditableText>
              <EditableText
                pageSlug="about"
                sectionKey="merced-address"
                defaultContent="750 Motel Dr, Merced, CA 95340"
                as="p"
                className="text-gray-700 mb-4"
              >
                {getContent(content, 'merced-address', '750 Motel Dr, Merced, CA 95340')}
              </EditableText>
              <EditableText
                pageSlug="about"
                sectionKey="merced-description"
                defaultContent="Our lessons take place at quality facilities we rent for our swim program."
                as="p"
                className="text-gray-600 mb-4"
              >
                {getContent(content, 'merced-description', 'Our lessons take place at quality facilities we rent for our swim program.')}
              </EditableText>
              <div className="space-y-2 text-gray-600">
                <EditableText
                  pageSlug="about"
                  sectionKey="merced-feature-1"
                  defaultContent="• Heated indoor pool"
                  as="p"
                >
                  {getContent(content, 'merced-feature-1', '• Heated indoor pool')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="merced-feature-2"
                  defaultContent="• Private changing rooms"
                  as="p"
                >
                  {getContent(content, 'merced-feature-2', '• Private changing rooms')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="merced-feature-3"
                  defaultContent="• Sensory-friendly environment"
                  as="p"
                >
                  {getContent(content, 'merced-feature-3', '• Sensory-friendly environment')}
                </EditableText>
                <EditableText
                  pageSlug="about"
                  sectionKey="merced-feature-4"
                  defaultContent="• Observation area for parents"
                  as="p"
                >
                  {getContent(content, 'merced-feature-4', '• Observation area for parents')}
                </EditableText>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}