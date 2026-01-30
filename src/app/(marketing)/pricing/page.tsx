import { createClient } from '@/lib/supabase/server';
import PricingContent from './PricingContent';

export interface RegionalCenter {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

export default async function PricingPage() {
  const supabase = await createClient();

  let regionalCenters: RegionalCenter[] = [];
  try {
    const { data, error } = await supabase
      .from('funding_sources')
      .select('id, name, short_name, logo_url')
      .in('funding_type', ['regional_center', 'self_determination'])
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching regional centers:', error);
    } else {
      regionalCenters = data || [];
    }
  } catch (error) {
    console.error('Error in regional centers query:', error);
    regionalCenters = [];
  }

  const regionalCenterNames = regionalCenters?.map(fs => fs.short_name || fs.name) || ['VMRC', 'CVRC'];

  return <PricingContent regionalCenterNames={regionalCenterNames} />;
}