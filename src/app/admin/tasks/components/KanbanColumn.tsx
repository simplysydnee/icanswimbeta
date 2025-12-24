'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: string;
  color: string;
  taskCount: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, icon, color, taskCount, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`h-full ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <CardHeader className={`pb-3 ${color} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            {title}
          </CardTitle>
          <Badge variant="secondary">{taskCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="min-h-[400px]">
          {children}
        </div>
        {taskCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No tasks in this column</p>
            <p className="text-xs mt-1">Drag tasks here or create new ones</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}