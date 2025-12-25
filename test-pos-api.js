// Test script to check PO API response
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing PO API...');

    // Test without month filter
    const response1 = await fetch('http://localhost:3000/api/pos');
    const data1 = await response1.json();
    console.log('Response without month filter:');
    console.log(`- Status: ${response1.status}`);
    console.log(`- Data length: ${data1.data?.length || 0}`);
    console.log(`- Stats:`, data1.stats);
    console.log(`- Funding source stats:`, data1.fundingSourceStats?.length || 0);

    // Test with month filter
    const response2 = await fetch('http://localhost:3000/api/pos?month=2025-12');
    const data2 = await response2.json();
    console.log('\nResponse with month filter (Dec 2025):');
    console.log(`- Status: ${response2.status}`);
    console.log(`- Data length: ${data2.data?.length || 0}`);
    console.log(`- Stats:`, data2.stats);
    console.log(`- Funding source stats:`, data2.fundingSourceStats?.length || 0);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();