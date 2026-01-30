import { createClient } from '@/lib/supabase/server';
import TeamContent from './TeamContent';

export interface TeamMember {
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

  return <TeamContent team={team} />;
}