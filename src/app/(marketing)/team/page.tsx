import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  credentials: string[] | null;
}

export default async function TeamPage() {
  const supabase = await createClient();

  let team: TeamMember[] = [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, title, credentials')
      .eq('display_on_team', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      team = data || [];
    }
  } catch (error) {
    console.error('Error in team query:', error);
    team = [];
  }

  // Fallback to Sutton if no team members found
  if (team.length === 0) {
    team = [{
      id: 'fallback-sutton',
      full_name: 'Sutton Lucas',
      avatar_url: '/images/sutton-lucas.jpg',
      title: 'Owner & Lead Instructor',
      bio: 'Sutton has been teaching individuals with special needs for more than 14 years. She holds a Bachelor of Arts in Liberal Studies from Cal Poly San Luis Obispo, a Master\'s in Education, and three teaching credentials in Special Education. She is Level 2 Adaptive Swim Whisper certified from Swim Angelfish.',
      credentials: ['BA Liberal Studies, Cal Poly SLO', 'MA Education', '3 Special Education Credentials', 'Level 2 Adaptive Swim Whisper']
    }];
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
          Our Team
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Meet the dedicated professionals who make I Can Swim possible
        </p>
      </div>

      {/* Team Members */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => {
            const initials = member.full_name
              .split(' ')
              .map((name) => name[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={member.id} className="bg-white rounded-2xl p-8 shadow-sm border">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-6 overflow-hidden">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.full_name}</h3>
                {member.title && (
                  <p className="text-cyan-600 font-medium mb-4">{member.title}</p>
                )}
                {member.bio && (
                  <p className="text-gray-700 mb-4">{member.bio}</p>
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
            );
          })}
        </div>

        {/* Team Values */}
        <div className="mt-16 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Patience & Understanding</h3>
              <p className="text-gray-700">
                We understand that every child learns at their own pace. Our instructors are trained to be patient, observant, and responsive to each swimmer&apos;s needs.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Continuous Training</h3>
              <p className="text-gray-700">
                Our team undergoes regular training in the latest adaptive aquatics techniques, safety protocols, and special needs education.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Family Partnership</h3>
              <p className="text-gray-700">
                We believe in working closely with families to understand each swimmer&apos;s unique needs, goals, and progress.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety Certification</h3>
              <p className="text-gray-700">
                All instructors are Swim Angelfish certified, in addition to CPR, First Aid, and water safety certification, with specialized training in special needs aquatic safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}