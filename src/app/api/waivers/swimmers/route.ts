import { validateWaiverToken, getSwimmersNeedingWaivers } from '@/lib/db/waivers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    const validation = await validateWaiverToken(token);
    if (!validation.valid) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!validation.parentEmail) {
      return Response.json(
        { error: 'Parent email not found' },
        { status: 400 }
      );
    }

    const swimmers = await getSwimmersNeedingWaivers(
      validation.parentId || null,
      validation.parentEmail
    );

    return Response.json({
      parentName: validation.parentName,
      parentEmail: validation.parentEmail,
      swimmers
    });
  } catch (error) {
    console.error('Get swimmers error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}