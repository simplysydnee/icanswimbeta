import { createClient } from '@/lib/supabase/server';
import { getWaiverCompletionStats } from '@/lib/db/waivers';

export async function GET(request: Request) {
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

    const stats = await getWaiverCompletionStats();

    return Response.json(stats);
  } catch (error) {
    console.error('Get completion status error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}