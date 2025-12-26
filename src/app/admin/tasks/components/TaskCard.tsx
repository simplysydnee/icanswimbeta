'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Users, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserBadge } from '@/components/ui/user-badge';
import { getUserColor } from '@/lib/user-colors';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'needs_attention';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'swimmer_related' | 'business_operations' | 'follow_up' | 'other';
  due_date: string | null;
  assigned_to: string | null;
  swimmer_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assigned_to_user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  created_by_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  swimmer?: {
    id: string;
    first_name: string;
    last_name: string;
    client_number: string;
  } | null;
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  formatDueDate: (dateString: string | null) => string | null;
  getPriorityColor: (priority: string) => string;
}

export function TaskCard({ task, onEdit, onDelete, formatDueDate, getPriorityColor }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'swimmer_related': return 'Swimmer';
      case 'business_operations': return 'Business';
      case 'follow_up': return 'Follow-up';
      default: return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'swimmer_related': return 'bg-blue-100 text-blue-800';
      case 'business_operations': return 'bg-purple-100 text-purple-800';
      case 'follow_up': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-move",
        task.assignee?.id && `border-l-4 ${getUserColor(task.assignee.id).border}`,
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        <Badge className={getCategoryColor(task.category)} variant="outline">
          {getCategoryLabel(task.category)}
        </Badge>
      </div>

      <div className="space-y-2">
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Due: {formatDueDate(task.due_date)}
          </div>
        )}

        {task.swimmer && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {task.swimmer.first_name} {task.swimmer.last_name}
          </div>
        )}
      </div>

      {/* User badges section */}
      {(task.created_by_user || task.assigned_to_user) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t text-xs">
          {task.created_by_user && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">By:</span>
              <UserBadge
                userId={task.created_by_user.id}
                fullName={task.created_by_user.full_name}
                email={task.created_by_user.email}
                size="sm"
              />
            </div>
          )}
          {task.assigned_to_user && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">For:</span>
              <UserBadge
                userId={task.assigned_to_user.id}
                fullName={task.assigned_to_user.full_name}
                email={task.assigned_to_user.email}
                size="sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}