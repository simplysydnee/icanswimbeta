import { validateWaiverToken } from '@/lib/db/waivers';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(32).max(64)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = schema.parse(body);

    const result = await validateWaiverToken(token);

    if (!result.valid) {
      return Response.json(
        { error: result.error || 'Invalid token' },
        { status: 401 }
      );
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Token validation error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}