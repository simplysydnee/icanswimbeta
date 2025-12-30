import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PriorityBadgeProps {
  reason?: string | null
  expiresAt?: string | null
}

const reasonLabels: Record<string, string> = {
  manual: 'Manual',
  attendance: 'Perfect Attendance',
  medical: 'Medical',
  behavioral: 'Behavioral'
}

export function PriorityBadge({ reason, expiresAt }: PriorityBadgeProps) {
  const isExpired = expiresAt && new Date(expiresAt) < new Date()

  if (isExpired) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1 border-yellow-400 text-yellow-700 bg-yellow-50">
            <Star className="h-3 w-3 fill-yellow-400" />
            Priority
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reason: {reasonLabels[reason || 'manual'] || reason}</p>
          {expiresAt && <p>Expires: {new Date(expiresAt).toLocaleDateString()}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}