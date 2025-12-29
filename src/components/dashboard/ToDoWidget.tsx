'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserColor, getUserInitials } from '@/lib/user-colors';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
  assigned_to_user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export function ToDoWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ todo: 0, needsAttention: 0 });

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();

      const todoTasks = data.tasks?.filter((t: Task) =>
        t.status === 'todo' || t.status === 'needs_attention'
      ) || [];

      setTasks(todoTasks.slice(0, 5));
      setCounts({
        todo: data.tasks?.filter((t: Task) => t.status === 'todo').length || 0,
        needsAttention: data.tasks?.filter((t: Task) => t.status === 'needs_attention').length || 0
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          My To Do&apos;s
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="font-medium">
            {counts.todo} to do
          </Badge>
          {counts.needsAttention > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" />
              {counts.needsAttention}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No pending tasks 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {task.assigned_to_user && (
                      <span className={cn(
                        "inline-flex items-center justify-center rounded-full font-medium text-[10px] h-5 w-5 flex-shrink-0",
                        getUserColor(task.assigned_to_user.id).bg,
                        getUserColor(task.assigned_to_user.id).text
                      )}>
                        {getUserInitials(task.assigned_to_user.full_name)}
                      </span>
                    )}
                    <p className="text-sm font-medium truncate">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span>Due: {formatDueDate(task.due_date)}</span>
                    )}
                    {task.assigned_to_user && (
                      <span className="truncate max-w-[120px]">
                        For: {task.assigned_to_user.full_name || task.assigned_to_user.email}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  className={`${getPriorityColor(task.priority)} ml-2 flex-shrink-0`}
                  variant="outline"
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/tasks" className="block mt-4">
          <Button variant="ghost" className="w-full text-primary hover:text-primary-dark">
            View All Tasks
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}