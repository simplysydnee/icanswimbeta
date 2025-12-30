import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Flag } from 'lucide-react'
import { format } from 'date-fns'

interface TaskCardMobileProps {
  task: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    assigned_to_user?: {
      full_name: string
      avatar_url?: string
    }
  }
  onClick?: () => void
}

export function TaskCardMobile({ task, onClick }: TaskCardMobileProps) {
  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  }

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    needs_attention: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className="p-4 bg-white rounded-lg border shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Flag className={`h-5 w-5 mt-0.5 ${priorityColors[task.priority] || 'text-gray-400'}`} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge className={statusColors[task.status] || 'bg-gray-100'}>
              {task.status.replace('_', ' ')}
            </Badge>

            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d')}
              </div>
            )}
          </div>
        </div>

        {task.assigned_to_user && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={task.assigned_to_user.avatar_url} />
            <AvatarFallback className="text-xs">
              {task.assigned_to_user.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}