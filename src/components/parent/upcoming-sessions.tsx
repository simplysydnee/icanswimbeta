'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UpcomingSessionsProps {
  bookings: Array<{
    id: string
    session: {
      id: string
      start_time: string
      end_time: string
      location: string
      instructor?: {
        full_name?: string
      }
    }
    swimmer: {
      first_name: string
      last_name: string
    }
  }>
}

export function UpcomingSessions({ bookings }: UpcomingSessionsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
          <CardDescription>
            No upcoming sessions scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Book a session to see upcoming lessons here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
        <CardDescription>
          Your swimmer&apos;s scheduled lessons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {booking.swimmer.first_name} {booking.swimmer.last_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {booking.session.location}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(booking.session.start_time)} • {formatTime(booking.session.start_time)}
              </div>
              {booking.session.instructor?.full_name && (
                <div className="text-xs text-muted-foreground mt-1">
                  Instructor: {booking.session.instructor.full_name}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}