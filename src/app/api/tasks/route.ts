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
  due_date: z.string().optional().transform(val => {
    if (!val) return null;
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }),
  assigned_to: z.string().uuid().optional().transform(val => val || null),
  swimmer_id: z.string().uuid().optional().transform(val => val || null),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Tasks API: Starting request');
    const supabase = await createClient();
    console.log('Tasks API: Supabase client created');

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Tasks API: Auth check complete', { user: user?.email, userId: user?.id, authError });
    if (authError || !user) {
      console.error('Auth error in tasks API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const createdBy = searchParams.get('created_by');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const swimmerId = searchParams.get('swimmer_id');

    // Build query - RLS policies will handle access control
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_user:profiles!assigned_to (
          id,
          full_name,
          email
        ),
        created_by_user:profiles!created_by (
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

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (createdBy) {
      query = query.eq('created_by', createdBy);
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

    console.log('Tasks API: Executing query');
    const { data: tasks, error } = await query;
    console.log('Tasks API: Query result', { error: error?.message, taskCount: tasks?.length });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
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
    const { data: tasks, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user.id,
      })
      .select(`
        *,
        assigned_to_user:profiles!assigned_to (
          id,
          full_name,
          email
        ),
        created_by_user:profiles!created_by (
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
      `);

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      console.error('No task returned after insert');
      return NextResponse.json(
        { error: 'Task created but not returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: tasks[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in tasks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}