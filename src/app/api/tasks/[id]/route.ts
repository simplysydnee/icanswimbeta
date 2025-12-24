import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updates
const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'needs_attention']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['swimmer_related', 'business_operations', 'follow_up', 'other']).optional(),
  due_date: z.string().optional().transform(val => val ? new Date(val).toISOString().split('T')[0] : null),
  assigned_to: z.string().uuid().optional(),
  swimmer_id: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

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
      .eq('id', taskId);

    // Apply RLS automatically through Supabase policies
    // For non-owners, we need to filter to show only their tasks
    if (!isOwner) {
      query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    }

    const { data: task, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error fetching task:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error in task API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = taskUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid task data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // First, check if user has permission to update this task
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', taskId)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is owner (sutton@icanswim209.com)
    const { data: userData } = await supabase.auth.getUser();
    const isOwner = userData.user?.email === 'sutton@icanswim209.com';

    // Check permissions
    const canUpdate = isOwner ||
      existingTask.assigned_to === user.id ||
      existingTask.created_by === user.id;

    if (!canUpdate) {
      return NextResponse.json({ error: 'Not authorized to update this task' }, { status: 403 });
    }

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
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
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error in task API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    // First, check if user has permission to delete this task
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('created_by')
      .eq('id', taskId)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is owner (sutton@icanswim209.com)
    const { data: userData } = await supabase.auth.getUser();
    const isOwner = userData.user?.email === 'sutton@icanswim209.com';

    // Check permissions - only creator or owner can delete
    const canDelete = isOwner || existingTask.created_by === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this task' }, { status: 403 });
    }

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in task API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}