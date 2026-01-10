#!/usr/bin/env node

/**
 * Query ambiguous UCI matches
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ambiguous records
const ambiguousRecords = [
  { uci: '7763834', last_name: 'BARAJAS', first_name_partial: 'AL', pdf_name: 'BARAJAS, JR, AL' },
  { uci: '8657143', last_name: 'CASTILLO', first_name_partial: 'ELLIE', pdf_name: 'CASTILLO, ELLIE' },
  { uci: '8658744', last_name: 'FERRY', first_name_partial: 'RYLIE', pdf_name: 'FERRY, RYLIE' },
  { uci: '8660482', last_name: 'GARCIA', first_name_partial: 'ARIELLA', pdf_name: 'GARCIA, ARIELLA' },
  { uci: '7779288', last_name: 'HARVEY', first_name_partial: 'CAMERON', pdf_name: 'HARVEY, CAMERON' },
  { uci: '7779371', last_name: 'JOHNSON', first_name_partial: 'THOMAS', pdf_name: 'JOHNSON, THOMAS' },
  { uci: '8659913', last_name: 'SINGH', first_name_partial: 'RAYYAAN', pdf_name: 'SINGH, RAYYAAN' },
  { uci: '8656331', last_name: 'SINGH', first_name_partial: 'TEGHVEER', pdf_name: 'SINGH, TEGHVEER' },
  { uci: '7787543', last_name: 'TORRES', first_name_partial: 'KYNZLEI', pdf_name: 'TORRES, KYNZLEI' }
];

async function querySwimmers(lastName) {
  try {
    const { data, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        enrollment_status,
        funding_source_id,
        uci_number,
        funding_source:funding_sources!swimmers_funding_source_id_fkey (
          id,
          name,
          short_name,
          is_vmrc
        )
      `)
      .ilike('last_name', `%${lastName}%`)
      .order('first_name');

    if (error) {
      console.error('Database error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error querying swimmers:', err);
    return [];
  }
}

async function main() {
  console.log('🔍 QUERYING AMBIGUOUS UCI MATCHES (9 RECORDS)\n');
  console.log('=============================================\n');

  for (const record of ambiguousRecords) {
    console.log(`\n${record.pdf_name} (UCI: ${record.uci})`);
    console.log('='.repeat(50));

    const swimmers = await querySwimmers(record.last_name);

    if (swimmers.length === 0) {
      console.log('No swimmers found with this last name.');
      continue;
    }

    // Filter by first name prefix if available
    const filteredSwimmers = swimmers.filter(s =>
      s.first_name.toLowerCase().startsWith(record.first_name_partial.toLowerCase())
    );

    const displaySwimmers = filteredSwimmers.length > 0 ? filteredSwimmers : swimmers;

    console.log(`Found ${displaySwimmers.length} swimmer(s):\n`);

    displaySwimmers.forEach((swimmer, index) => {
      const fundingSource = swimmer.funding_source;
      const fundingInfo = fundingSource
        ? `${fundingSource.short_name}${fundingSource.is_vmrc ? ' (VMRC)' : ''}`
        : 'No funding source';

      console.log(`${index + 1}. ${swimmer.first_name} ${swimmer.last_name}`);
      console.log(`   ID: ${swimmer.id}`);
      console.log(`   Status: ${swimmer.enrollment_status}`);
      console.log(`   Funding: ${fundingInfo}`);
      console.log(`   Current UCI: ${swimmer.uci_number || 'None'}`);
      console.log('');
    });

    // Wait a bit between queries
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Query complete! Review the matches above.');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('For each ambiguous record, tell me which swimmer ID should get the UCI.');
  console.log('Example: "For BARAJAS, JR, AL (UCI: 7763834), use swimmer ID: c55cb986-a2ae-4b85-af56-1799d4e4e3f7"');
}

main().catch(console.error);