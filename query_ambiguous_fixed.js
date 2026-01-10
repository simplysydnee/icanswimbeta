#!/usr/bin/env node

/**
 * Query ambiguous UCI matches with corrected SQL
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ambiguous records
const ambiguousRecords = [
  { uci: '7763834', last_name: 'barajas', pdf_name: 'BARAJAS, JR, AL' },
  { uci: '8657143', last_name: 'castillo', pdf_name: 'CASTILLO, ELLIE' },
  { uci: '8658744', last_name: 'ferry', pdf_name: 'FERRY, RYLIE' },
  { uci: '8660482', last_name: 'garcia', pdf_name: 'GARCIA, ARIELLA' },
  { uci: '7779288', last_name: 'harvey', pdf_name: 'HARVEY, CAMERON' },
  { uci: '7779371', last_name: 'johnson', pdf_name: 'JOHNSON, THOMAS' },
  { uci: '8659913', last_name: 'singh', pdf_name: 'SINGH, RAYYAAN' },
  { uci: '8656331', last_name: 'singh', pdf_name: 'SINGH, TEGHVEER' },
  { uci: '7787543', last_name: 'torres', pdf_name: 'TORRES, KYNZLEI' }
];

async function querySwimmers(lastName) {
  try {
    // Use raw SQL query as specified
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT
          s.id,
          s.first_name,
          s.last_name,
          s.enrollment_status,
          s.uci_number,
          fs.name as funding_source
        FROM swimmers s
        LEFT JOIN funding_sources fs ON s.funding_source_id = fs.id
        WHERE LOWER(s.last_name) LIKE '%${lastName}%'
        ORDER BY s.first_name, s.last_name
      `
    });

    if (error) {
      console.error('Database error:', error);

      // Fallback to regular query if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          enrollment_status,
          uci_number,
          funding_source:funding_sources!swimmers_funding_source_id_fkey (
            name
          )
        `)
        .ilike('last_name', `%${lastName}%`)
        .order('first_name');

      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        return [];
      }

      // Transform fallback data to match expected format
      return (fallbackData || []).map(swimmer => ({
        id: swimmer.id,
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
        enrollment_status: swimmer.enrollment_status,
        uci_number: swimmer.uci_number,
        funding_source: swimmer.funding_source?.name || null
      }));
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
    console.log('='.repeat(60));

    const swimmers = await querySwimmers(record.last_name);

    if (swimmers.length === 0) {
      console.log('No swimmers found with this last name.');
      continue;
    }

    console.log(`Found ${swimmers.length} swimmer(s):\n`);

    swimmers.forEach((swimmer, index) => {
      console.log(`${index + 1}. ${swimmer.first_name} ${swimmer.last_name}`);
      console.log(`   ID: ${swimmer.id}`);
      console.log(`   Status: ${swimmer.enrollment_status}`);
      console.log(`   Funding Source: ${swimmer.funding_source || 'None'}`);
      console.log(`   Current UCI: ${swimmer.uci_number || 'None'}`);
      console.log('');
    });

    // Wait a bit between queries
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✅ Query complete! Review the matches above.');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('For each ambiguous record, tell me which swimmer ID should get the UCI.');
  console.log('Example: "For BARAJAS, JR, AL (UCI: 7763834), use swimmer ID: [ID]"');
}

main().catch(console.error);