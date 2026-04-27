'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface BookingRow {
  id: string
  status: string
  session: {
    id: string
    start_time: string
    end_time: string
    location: string | null
    status: string | null
    instructor: { id: string; full_name: string | null } | null
  } | null
  swimmer: {
    id: string
    first_name: string
    last_name: string
    current_level: { name: string; display_name: string; color: string | null } | null
  } | null
  progress_note: {
    id: string
    lesson_summary: string | null
    created_at: string
  } | null
}

export default function ParentProgressPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          session:sessions(
            id,
            start_time,
            end_time,
            location,
            status,
            instructor:profiles!instructor_id(id, full_name)
          ),
          swimmer:swimmers(
            id,
            first_name,
            last_name,
            current_level:swim_levels(name, display_name, color)
          ),
          progress_note:progress_notes(
            id,
            lesson_summary,
            created_at
          )
        `)
        .eq('parent_id', user.id)
        .in('status', ['confirmed', 'cancelled', 'completed'])
        .limit(200)

      if (bookingsError) throw bookingsError

      const normalized: BookingRow[] = (data || [])
        .filter((b: any) => b.session && b.swimmer)
        .map((b: any) => ({
          id: b.id,
          status: b.status,
          session: b.session,
          swimmer: b.swimmer,
          progress_note: Array.isArray(b.progress_note)
            ? b.progress_note[0] ?? null
            : b.progress_note ?? null,
        }))
        .sort(
          (a, b) =>
            new Date(b.session!.start_time).getTime() -
            new Date(a.session!.start_time).getTime()
        )

      setBookings(normalized)
    } catch (err: any) {
      console.error('Error fetching parent progress bookings:', err)
      setError(err?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const now = new Date()
  const totalBookings = bookings.length
  const notesAvailable = bookings.filter((b) => b.progress_note).length
  const upcoming = bookings.filter(
    (b) => b.session && new Date(b.session.start_time) > now
  ).length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading progress...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Progress Notes</h1>
        <p className="text-muted-foreground mt-2">
          Lesson notes from your swimmer&apos;s instructors
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchBookings}>
            Retry
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalBookings}</div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{notesAvailable}</div>
              <div className="text-sm text-muted-foreground">Notes Available</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{upcoming}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground">
              Once your swimmers have booked sessions, they&apos;ll appear here with
              their progress notes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <ParentSessionRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

function ParentSessionRow({ booking }: { booking: BookingRow }) {
  const session = booking.session!
  const swimmer = booking.swimmer!
  const startTime = parseISO(session.start_time)
  const endTime = parseISO(session.end_time)
  const isUpcoming = startTime > new Date()
  const hasNote = !!booking.progress_note
  const isCancelled = booking.status === 'cancelled'

  const statusBadge = (() => {
    if (isCancelled) {
      return (
        <Badge variant="outline" className="border-gray-200 text-gray-600">
          Cancelled
        </Badge>
      )
    }
    if (hasNote) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Notes Available
        </Badge>
      )
    }
    if (isUpcoming) {
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          Upcoming
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-amber-200 text-amber-700">
        <Clock className="h-3 w-3 mr-1" />
        Awaiting Notes
      </Badge>
    )
  })()

  const levelLabel = swimmer.current_level?.display_name || swimmer.current_level?.name
  const levelBadge = levelLabel ? (
    <Badge
      variant="outline"
      className="font-medium"
      style={
        swimmer.current_level?.color
          ? { backgroundColor: `${swimmer.current_level.color}20`, color: swimmer.current_level.color, borderColor: `${swimmer.current_level.color}40` }
          : undefined
      }
    >
      {levelLabel}
    </Badge>
  ) : null

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        hasNote ? 'border-green-200' : 'border-gray-200'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {swimmer.first_name} {swimmer.last_name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {statusBadge}
              {levelBadge}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm text-muted-foreground">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(startTime, 'EEE, MMM d, yyyy')}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{session.location}</span>
            </div>
          )}
          {session.instructor?.full_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Instructor: {session.instructor.full_name}</span>
            </div>
          )}
        </div>

        {hasNote && booking.progress_note && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">Progress Note</p>
                <p className="text-xs text-green-700 line-clamp-2">
                  {booking.progress_note.lesson_summary || 'View full note for details.'}
                </p>
                <span className="text-xs text-green-600">
                  Added {format(parseISO(booking.progress_note.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t">
        <div className="flex justify-end w-full">
          <Button size="sm" asChild>
            <Link href={`/parent/progress/${session.id}?bookingId=${booking.id}`}>
              View Progress
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
