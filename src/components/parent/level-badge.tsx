'use client'

import { Badge } from '@/components/ui/badge'

interface LevelBadgeProps {
  level: {
    name: string
    display_name: string
    color?: string
  }
  size?: 'sm' | 'md' | 'lg'
}

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const getLevelColor = (levelName: string) => {
    const colorMap: Record<string, string> = {
      white: 'bg-slate-100 text-slate-800 border-slate-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return colorMap[levelName] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getSizeClasses = (size: string) => {
    const sizeMap = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-2',
    }
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.md
  }

  return (
    <Badge
      variant="outline"
      className={`${getLevelColor(level.name)} ${getSizeClasses(size)} font-medium capitalize`}
    >
      {level.display_name}
    </Badge>
  )
}