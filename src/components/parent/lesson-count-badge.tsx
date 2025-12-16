'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LessonCountBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function LessonCountBadge({ count, size = 'md', showTooltip = true }: LessonCountBadgeProps) {
  const getBadgeConfig = (count: number) => {
    if (count >= 100) {
      return {
        icon: '🏆',
        text: '100+ lessons',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        tooltip: `${count} lessons completed! Gold milestone achieved!`
      }
    } else if (count >= 50) {
      return {
        icon: '🌟',
        text: '50+ lessons',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        tooltip: `${count} lessons completed! Silver milestone achieved!`
      }
    } else if (count >= 25) {
      return {
        icon: '⭐',
        text: '25+ lessons',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        tooltip: `${count} lessons completed! Bronze milestone achieved!`
      }
    } else if (count >= 10) {
      return {
        icon: '🎉',
        text: '10+ lessons',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        tooltip: `${count} lessons completed!`
      }
    } else {
      return {
        icon: '🏊',
        text: `${count} ${count === 1 ? 'lesson' : 'lessons'}`,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        tooltip: `${count} ${count === 1 ? 'lesson' : 'lessons'} completed`
      }
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5'
      case 'lg':
        return 'text-base px-4 py-1.5'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  const config = getBadgeConfig(count)
  const sizeClasses = getSizeClasses(size)

  const badge = (
    <Badge
      variant="outline"
      className={`${config.color} ${sizeClasses} font-medium`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}