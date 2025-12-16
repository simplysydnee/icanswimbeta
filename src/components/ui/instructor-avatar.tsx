'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface InstructorAvatarProps {
  name: string
  avatarUrl?: string | null
  photoStatus?: 'pending' | 'approved' | 'rejected' | null
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function InstructorAvatar({
  name,
  avatarUrl,
  size = 'md',
  showName = true
}: InstructorAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base'
  }

  const getInitials = (name: string) => {
    if (!name) return ''
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate a consistent color based on the name
  const getColorFromName = (name: string) => {
    if (!name) return '#0077B6' // Default blue

    // Simple hash function to generate consistent color
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    // Color palette inspired by ocean theme
    const colors = [
      '#0077B6', // Primary blue
      '#0096C7', // Light blue
      '#00B4D8', // Cyan
      '#48CAE4', // Light cyan
      '#90E0EF', // Very light blue
      '#03045E', // Dark blue
      '#023E8A', // Navy
      '#0096C7', // Sky blue
    ]

    return colors[Math.abs(hash) % colors.length]
  }

  const backgroundColor = getColorFromName(name)

  return (
    <div className="flex items-center gap-2">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback
          className="text-white font-medium"
          style={{ backgroundColor }}
        >
          {name ? getInitials(name) : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      {showName && name && (
        <span className="font-medium text-gray-700">{name}</span>
      )}
    </div>
  )
}