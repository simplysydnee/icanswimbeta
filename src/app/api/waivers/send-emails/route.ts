import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  parentIds: z.array(z.string().uuid()).optional()
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some(r => r.role === 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { parentIds } = schema.parse(body);

    // Call Edge Function to send emails
    const { data, error } = await supabase.functions.invoke('send-waiver-update-emails', {
      body: { parentIds }
    });

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('Send emails error:', error);
    return Response.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}