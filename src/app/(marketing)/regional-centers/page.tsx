import { createClient } from '@/lib/supabase/server';
import RegionalCentersContent from './RegionalCentersContent';

export const revalidate = 3600; // Revalidate every hour

export default async function RegionalCentersPage() {
  const supabase = await createClient();

  // Fetch ALL active regional centers and self-determination funding sources
  const { data: fundingSources, error } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('is_active', true);

  // Filter to show only regional centers and self-determination funding sources
  const regionalCenters = fundingSources?.filter(fs => {
    // Include regional centers
    if (fs.type === 'regional_center') {
      return true;
    }
    // Also include any funding sources that should be shown on regional centers page
    // (e.g., based on name containing specific keywords)
    const name = fs.name?.toLowerCase() || '';
    return name.includes('self determination') || name.includes('regional center');
  }) || [];

  if (error) {
    console.error('Error fetching regional centers:', error);
  }

  return <RegionalCentersContent regionalCenters={regionalCenters} />;
}