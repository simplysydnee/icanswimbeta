'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LevelBadge } from './level-badge'

interface SwimmerCardProps {
  swimmer: {
    id: string
    first_name: string
    last_name: string
    photo_url?: string
    enrollment_status: string
    current_level?: {
      name: string
      display_name: string
      color?: string
    }
  }
}

export function SwimmerCard({ swimmer }: SwimmerCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      waitlist: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      enrolled: 'bg-green-100 text-green-800 border-green-200',
      dropped: 'bg-red-100 text-red-800 border-red-200',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      waitlist: 'Waitlist',
      pending: 'Pending',
      enrolled: 'Enrolled',
      dropped: 'Dropped',
    }
    return statusMap[status] || status
  }

  return (
    <Link href={`/parent/swimmers/${swimmer.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getInitials(swimmer.first_name, swimmer.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {swimmer.first_name} {swimmer.last_name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {swimmer.current_level ? (
                    <LevelBadge level={swimmer.current_level} size="sm" />
                  ) : (
                    <span className="text-gray-500">No level assigned</span>
                  )}
                </div>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Badge
              variant="outline"
              className={`${getStatusColor(swimmer.enrollment_status)} text-xs`}
            >
              {getStatusDisplay(swimmer.enrollment_status)}
            </Badge>
            <div className="text-xs text-muted-foreground">
              View Details →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}