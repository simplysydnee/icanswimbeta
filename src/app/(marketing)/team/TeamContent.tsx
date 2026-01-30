'use client';

import Image from 'next/image';
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';
import { TeamMember } from './page';

interface TeamContentProps {
  team: TeamMember[];
}

export default function TeamContent({ team }: TeamContentProps) {
  const { data: content, isLoading } = usePageContent('team');

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
          pageSlug="team"
          sectionKey="page-title"
          defaultContent="Our Team"
          as="h1"
          className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4"
        >
          {getContent(content, 'page-title', 'Our Team')}
        </EditableText>
        <EditableText
          pageSlug="team"
          sectionKey="page-subtitle"
          defaultContent="Meet the dedicated professionals who make I Can Swim possible"
          as="p"
          className="text-xl text-gray-600 font-inter max-w-3xl mx-auto"
        >
          {getContent(content, 'page-subtitle', 'Meet the dedicated professionals who make I Can Swim possible')}
        </EditableText>
      </div>

      {/* Team Members */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {team.map((member) => {
            const initials = member.full_name
              .split(' ')
              .map((name) => name[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={member.id} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border flex flex-col h-full">
                {/* Avatar Container - Fixed height instead of aspect-square */}
                <div className="h-48 md:h-56 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-6 overflow-hidden">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-cyan-700">{initials}</span>
                  )}
                </div>

                {/* Content - Flex-grow to fill remaining space */}
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{member.full_name}</h3>
                  {member.title && (
                    <p className="text-cyan-600 font-medium mb-3">{member.title}</p>
                  )}
                  {member.bio && (
                    <p className="text-gray-700 mb-4 flex-grow">{member.bio}</p>
                  )}
                  {member.credentials && member.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {member.credentials.map((credential, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-cyan-50 text-cyan-700 text-sm rounded-full border border-cyan-100"
                        >
                          {credential}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Values */}
        <div className="mt-12 md:mt-16 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 md:p-8 lg:p-12">
          <EditableText
            pageSlug="team"
            sectionKey="values-title"
            defaultContent="Our Team Values"
            as="h2"
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-6"
          >
            {getContent(content, 'values-title', 'Our Team Values')}
          </EditableText>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <EditableText
                pageSlug="team"
                sectionKey="value-1-title"
                defaultContent="Patience & Understanding"
                as="h3"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                {getContent(content, 'value-1-title', 'Patience & Understanding')}
              </EditableText>
              <EditableText
                pageSlug="team"
                sectionKey="value-1-description"
                defaultContent="We understand that every child learns at their own pace. Our instructors are trained to be patient, observant, and responsive to each swimmer's needs."
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'value-1-description', "We understand that every child learns at their own pace. Our instructors are trained to be patient, observant, and responsive to each swimmer's needs.")}
              </EditableText>
            </div>
            <div>
              <EditableText
                pageSlug="team"
                sectionKey="value-2-title"
                defaultContent="Continuous Training"
                as="h3"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                {getContent(content, 'value-2-title', 'Continuous Training')}
              </EditableText>
              <EditableText
                pageSlug="team"
                sectionKey="value-2-description"
                defaultContent="Our team undergoes regular training in the latest adaptive aquatics techniques, safety protocols, and special needs education."
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'value-2-description', 'Our team undergoes regular training in the latest adaptive aquatics techniques, safety protocols, and special needs education.')}
              </EditableText>
            </div>
            <div>
              <EditableText
                pageSlug="team"
                sectionKey="value-3-title"
                defaultContent="Family Partnership"
                as="h3"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                {getContent(content, 'value-3-title', 'Family Partnership')}
              </EditableText>
              <EditableText
                pageSlug="team"
                sectionKey="value-3-description"
                defaultContent="We believe in working closely with families to understand each swimmer's unique needs, goals, and progress."
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'value-3-description', "We believe in working closely with families to understand each swimmer's unique needs, goals, and progress.")}
              </EditableText>
            </div>
            <div>
              <EditableText
                pageSlug="team"
                sectionKey="value-4-title"
                defaultContent="Safety Certification"
                as="h3"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                {getContent(content, 'value-4-title', 'Safety Certification')}
              </EditableText>
              <EditableText
                pageSlug="team"
                sectionKey="value-4-description"
                defaultContent="All instructors are Swim Angelfish certified, in addition to CPR, First Aid, and water safety certification, with specialized training in special needs aquatic safety."
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'value-4-description', 'All instructors are Swim Angelfish certified, in addition to CPR, First Aid, and water safety certification, with specialized training in special needs aquatic safety.')}
              </EditableText>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}