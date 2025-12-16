'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LevelBadge } from './level-badge'
import { LessonCountBadge } from './lesson-count-badge'
import { Calendar } from 'lucide-react'

interface SwimmerCardProps {
  swimmer: {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string
    photo_url?: string
    enrollment_status: string
    current_level?: {
      name: string
      display_name: string
      color?: string
    }
    funding_source_id?: string
    funding_source_name?: string
    lessons_completed?: number
    next_session?: {
      start_time?: string
      instructor_name?: string
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

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const formatNextSession = (nextSession?: { start_time?: string; instructor_name?: string }) => {
    if (!nextSession?.start_time) return null

    const date = new Date(nextSession.start_time)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dayDisplay = ''
    if (date.toDateString() === today.toDateString()) {
      dayDisplay = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayDisplay = 'Tomorrow'
    } else {
      dayDisplay = date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    return `${dayDisplay} ${time}`
  }

  const age = calculateAge(swimmer.date_of_birth)
  const nextSessionDisplay = formatNextSession(swimmer.next_session)
  const hasFundingSource = !!swimmer.funding_source_id
  const fundingSourceName = swimmer.funding_source_name

  return (
    <Link href={`/parent/swimmers/${swimmer.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getInitials(swimmer.first_name, swimmer.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">
                  {swimmer.first_name} {swimmer.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {age ? `${age} years old` : 'Age not specified'}
                </div>
                <div className="mt-1">
                  {swimmer.current_level ? (
                    <LevelBadge level={swimmer.current_level} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-500">No level assigned</span>
                  )}
                </div>
              </div>
            </div>
            {hasFundingSource && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                {fundingSourceName || 'Funding'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Badge
                variant="outline"
                className={`${getStatusColor(swimmer.enrollment_status)} text-xs`}
              >
                {getStatusDisplay(swimmer.enrollment_status)}
              </Badge>
              {swimmer.lessons_completed !== undefined && swimmer.lessons_completed > 0 && (
                <LessonCountBadge count={swimmer.lessons_completed} size="sm" />
              )}
            </div>

            {nextSessionDisplay ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-2 rounded-md">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Next: {nextSessionDisplay}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No upcoming sessions
              </div>
            )}
          </div>
        </CardContent>
        <div className="px-6 pb-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground flex justify-between items-center">
            <span>Click to view details</span>
            <span className="text-blue-600 font-medium">→</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}