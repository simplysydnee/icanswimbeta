'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, User, Calendar, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserBadge } from '@/components/ui/user-badge';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';

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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const columns = [
  { id: 'column-todo', title: 'To Do', color: 'bg-gray-100', icon: '📝' },
  { id: 'column-in_progress', title: 'In Progress', color: 'bg-blue-100', icon: '⏳' },
  { id: 'column-completed', title: 'Completed', color: 'bg-green-100', icon: '✅' },
  { id: 'column-needs_attention', title: 'Needs Attention', color: 'bg-red-100', icon: '⚠️' },
];

export function KanbanBoard({ tasks, onTaskUpdate, onTaskEdit, onTaskDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tasksState, setTasksState] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🎯 Drag started:', event.active.id);
    const task = tasksState.find(t => t.id === event.active.id);
    console.log('🎯 Found task:', task?.title);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('🎯 Drag end:', { activeId: active.id, overId: over?.id, overData: over?.data?.current });

    if (!over) {
      console.log('🎯 No drop target');
      setActiveTask(null);
      return;
    }

    // Check if we're dropping on a column (empty column area or column itself)
    const isColumn = columns.some(col => col.id === over.id);
    console.log('🎯 Over analysis:', { overId: over.id, isColumn, overData: over.data?.current });

    if (active.id !== over.id) {
      const activeTask = tasksState.find(t => t.id === active.id);

      // Determine the target column ID
      let targetColumnId: string | null = null;

      // Case 1: Dropping directly on a column (empty column area)
      if (isColumn) {
        targetColumnId = over.id as string;
        console.log('🎯 Dropping directly on column:', targetColumnId);
      }
      // Case 2: Dropping on a task within a column
      else {
        // Find which column the over task belongs to
        const overTask = tasksState.find(t => t.id === over.id);
        if (overTask) {
          targetColumnId = `column-${overTask.status}`;
          console.log('🎯 Dropping on task in column:', targetColumnId, 'Task status:', overTask.status);
        }
      }

      if (activeTask && targetColumnId) {
        // Remove 'column-' prefix to get status
        const status = targetColumnId.replace('column-', '') as Task['status'];

        // Only update if status is changing
        if (activeTask.status !== status) {
          console.log('🎯 Updating task status from', activeTask.status, 'to', status);
          const updatedTask = { ...activeTask, status };
          onTaskUpdate(activeTask.id, { status });
          setTasksState(prev => prev.map(t => t.id === activeTask.id ? updatedTask : t));
        } else {
          console.log('🎯 Same column, attempting reorder');
          // Reorder within same column
          const oldIndex = tasksState.findIndex(t => t.id === active.id);
          const newIndex = tasksState.findIndex(t => t.id === over.id);

          console.log('🎯 Reorder indices:', { oldIndex, newIndex });

          if (oldIndex !== -1 && newIndex !== -1) {
            const newTasks = arrayMove(tasksState, oldIndex, newIndex);
            setTasksState(newTasks);
          } else {
            console.log('🎯 Invalid indices for reorder');
          }
        }
      } else {
        console.log('🎯 Could not determine target column or find active task');
      }
    } else {
      console.log('🎯 Dropped on itself');
    }

    setActiveTask(null);
  };

  const getTasksByStatus = (columnId: string) => {
    // Remove 'column-' prefix to get status
    const status = columnId.replace('column-', '');
    return tasksState.filter(task => task.status === status);
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => {
          console.log('🎯 DndContext dragStart triggered');
          handleDragStart(e);
        }}
        onDragEnd={handleDragEnd}
        modifiers={[]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              color={column.color}
              taskCount={getTasksByStatus(column.id).length}
            >
              {getTasksByStatus(column.id).length > 0 ? (
                <SortableContext
                  items={getTasksByStatus(column.id).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {getTasksByStatus(column.id).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => onTaskEdit(task)}
                        onDelete={() => onTaskDelete(task.id)}
                        formatDueDate={formatDueDate}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="space-y-3">
                  {/* Empty column - still droppable */}
                </div>
              )}
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm line-clamp-2">{activeTask.title}</h3>
                <Badge className={getPriorityColor(activeTask.priority)}>
                  {activeTask.priority}
                </Badge>
              </div>
              {activeTask.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  {formatDueDate(activeTask.due_date)}
                </div>
              )}
              {(activeTask.created_by_user || activeTask.assigned_to_user) && (
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t text-xs">
                  {activeTask.created_by_user && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">By:</span>
                      <UserBadge
                        userId={activeTask.created_by_user.id}
                        fullName={activeTask.created_by_user.full_name}
                        email={activeTask.created_by_user.email}
                        size="sm"
                      />
                    </div>
                  )}
                  {activeTask.assigned_to_user && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Assigned to:</span>
                      <UserBadge
                        userId={activeTask.assigned_to_user.id}
                        fullName={activeTask.assigned_to_user.full_name}
                        email={activeTask.assigned_to_user.email}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}