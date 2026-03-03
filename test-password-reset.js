// Test script to check password reset API
const fetch = require('node-fetch');

async function testPasswordReset() {
  const email = 'test@example.com'; // Replace with a test email
  const appUrl = 'http://localhost:3000';

  console.log('Testing password reset API...');
  console.log('Email:', email);
  console.log('App URL:', appUrl);

  try {
    const response = await fetch('http://localhost:3000/api/auth/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirectTo: `${appUrl}/reset-password`,
      }),
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Error:', result.error);
    }

  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testPasswordReset();