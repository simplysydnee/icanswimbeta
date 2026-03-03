// Test the Edge Function directly
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0';

async function testEdgeFunction() {
  console.log('Testing Edge Function: send-enrollment-email');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/send-enrollment-email`);

  const testEmail = 'YOUR_REAL_EMAIL@example.com'; // CHANGE THIS to a real email for testing

  const payload = {
    to: testEmail,
    templateType: 'parent_invitation',
    parentName: 'Test Parent',
    childName: 'Test Child',
    customData: {
      subject: 'Test Parent Invitation',
      html: '<p>This is a test email from the Edge Function.</p>'
    }
  };

  console.log('\nSending test request with payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-enrollment-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.ok) {
      console.log('\n✅ Edge Function call successful');
    } else {
      console.log('\n❌ Edge Function call failed');
    }

  } catch (error) {
    console.error('\n❌ Error calling Edge Function:', error);
    console.error('Error stack:', error.stack);
  }
}

// Also check if we can get the function details
async function checkFunctionDetails() {
  console.log('\n\nChecking Edge Function details...');
  try {
    // Note: This endpoint might require different authentication
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-enrollment-email`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('GET Response Status:', response.status);
    const text = await response.text();
    console.log('GET Response:', text);
  } catch (error) {
    console.log('GET request failed (expected for POST-only function)');
  }
}

testEdgeFunction().then(() => {
  setTimeout(checkFunctionDetails, 1000);
});