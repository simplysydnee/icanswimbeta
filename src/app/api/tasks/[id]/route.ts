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

    // Check admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin') || false;

    // Build query
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
      .eq('id', taskId);

    // Apply RLS automatically through Supabase policies
    // For non-admins, we need to filter to show only their tasks
    if (!isAdmin) {
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

    // Check permissions
    const canUpdate = isAdmin ||
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

    // Check permissions - only creator or admin can delete
    const canDelete = isAdmin || existingTask.created_by === user.id;

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