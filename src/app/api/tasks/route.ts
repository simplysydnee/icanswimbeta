import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'needs_attention']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['swimmer_related', 'business_operations', 'follow_up', 'other']).default('other'),
  due_date: z.string().optional().transform(val => val ? new Date(val).toISOString().split('T')[0] : null),
  assigned_to: z.string().uuid().optional(),
  swimmer_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const swimmerId = searchParams.get('swimmer_id');

    // Check if user is owner (sutton@icanswim209.com)
    const { data: userData } = await supabase.auth.getUser();
    const isOwner = userData.user?.email === 'sutton@icanswim209.com';

    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_user:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        created_by_user:profiles!tasks_created_by_fkey (
          id,
          full_name,
          email
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          client_number
        )
      `)
      .order('created_at', { ascending: false });

    // Apply RLS automatically through Supabase policies
    // For non-owners, we need to filter to show only their tasks
    if (!isOwner) {
      query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (assignedTo && (isOwner || assignedTo === user.id)) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (swimmerId) {
      query = query.eq('swimmer_id', swimmerId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error in tasks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = taskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid task data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const taskData = validationResult.data;

    // Insert task with created_by set to current user
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user.id,
      })
      .select(`
        *,
        assigned_to_user:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        created_by_user:profiles!tasks_created_by_fkey (
          id,
          full_name,
          email
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          client_number
        )
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error in tasks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}