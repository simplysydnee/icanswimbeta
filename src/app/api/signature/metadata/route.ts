import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get client IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  let ip = 'unknown';
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else {
    // Fallback for development/localhost
    ip = '127.0.0.1';
  }

  // Get user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return NextResponse.json({
    ip,
    timestamp: new Date().toISOString(),
    userAgent,
    method: 'GET',
    success: true,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signatureType, signatureText, signerName, signerEmail } = body;

    // Get client IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    let ip = 'unknown';
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    } else {
      ip = '127.0.0.1';
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return NextResponse.json({
      ip,
      timestamp: new Date().toISOString(),
      userAgent,
      signatureType,
      signatureText: signatureText ? '[REDACTED]' : null, // Don't return full signature in response
      signerName: signerName ? '[REDACTED]' : null,
      signerEmail: signerEmail ? '[REDACTED]' : null,
      method: 'POST',
      success: true,
      message: 'Signature metadata captured successfully',
    });
  } catch (error) {
    console.error('Error capturing signature metadata:', error);
    return NextResponse.json(
      { error: 'Failed to capture signature metadata', success: false },
      { status: 500 }
    );
  }
}