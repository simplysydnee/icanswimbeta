'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  Circle,
  AlertCircle,
  Award,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Booking {
  id: string
  swimmer_id: string
  session: {
    id: string
    start_time: string
    end_time: string
    location: string | null
    instructor: { full_name: string | null } | null
  } | null
  swimmer: {
    id: string
    first_name: string
    last_name: string
    current_level: { name: string; display_name: string; color: string | null } | null
  } | null
}

interface ProgressNote {
  id: string
  lesson_summary: string | null
  parent_notes: string | null
  attendance_status: string | null
  swimmer_mood: string | null
  water_comfort: string | null
  focus_level: string | null
  skills_working_on: string[] | null
  skills_mastered: string[] | null
  shared_with_parent: boolean
  created_at: string
  instructor: { full_name: string | null } | null
}

interface SkillRef {
  id: string
  name: string
  level?: { display_name?: string | null; color?: string | null } | null
}

const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  no_show: 'No Show',
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'Happy/Excited',
  calm: 'Calm/Relaxed',
  anxious: 'Anxious/Nervous',
  resistant: 'Resistant',
  tired: 'Tired',
  other: 'Other',
}

const COMFORT_LABELS: Record<string, string> = {
  very_comfortable: 'Very Comfortable',
  comfortable: 'Comfortable',
  somewhat_comfortable: 'Somewhat Comfortable',
  uncomfortable: 'Uncomfortable',
  very_uncomfortable: 'Very Uncomfortable',
}

const FOCUS_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  distracted: 'Distracted',
}

function formatLabel(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—'
  return map[value] || value
}

export default function ParentProgressDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const sessionId = params.sessionId as string
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [note, setNote] = useState<ProgressNote | null>(null)
  const [skillsById, setSkillsById] = useState<Record<string, SkillRef>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user || !bookingId) return

    try {
      setLoading(true)
      setError(null)

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          swimmer_id,
          session:sessions(
            id,
            start_time,
            end_time,
            location,
            instructor:profiles!instructor_id(full_name)
          ),
          swimmer:swimmers(
            id,
            first_name,
            last_name,
            current_level:swim_levels(name, display_name, color)
          )
        `)
        .eq('id', bookingId)
        .eq('parent_id', user.id)
        .maybeSingle()

      if (bookingError) throw bookingError
      if (!bookingData || !bookingData.session || !bookingData.swimmer) {
        router.replace('/parent/progress')
        return
      }

      setBooking(bookingData as unknown as Booking)

      // Note: instructor_notes is intentionally omitted from this SELECT
      // so it never reaches the parent-facing client.
      const { data: noteData, error: noteError } = await supabase
        .from('progress_notes')
        .select(
          'id, lesson_summary, parent_notes, attendance_status, swimmer_mood, water_comfort, focus_level, skills_working_on, skills_mastered, shared_with_parent, created_at, instructor:profiles!instructor_id(full_name)'
        )
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (noteError) throw noteError
      const normalizedNote = (noteData as unknown as ProgressNote) || null
      setNote(normalizedNote)

      if (normalizedNote) {
        const ids = Array.from(
          new Set(
            [
              ...(normalizedNote.skills_working_on || []),
              ...(normalizedNote.skills_mastered || []),
            ].filter(Boolean)
          )
        )
        if (ids.length > 0) {
          const { data: skillsData } = await supabase
            .from('skills')
            .select('id, name, level:swim_levels(display_name, color)')
            .in('id', ids)
          const lookup: Record<string, SkillRef> = {}
          ;(skillsData || []).forEach((s: any) => {
            lookup[s.id] = s as SkillRef
          })
          setSkillsById(lookup)
        }
      }
    } catch (err: any) {
      console.error('Error fetching parent progress detail:', err)
      setError(err?.message || 'Failed to load progress note')
    } finally {
      setLoading(false)
    }
  }, [user, bookingId, supabase, router])

  useEffect(() => {
    if (!bookingId) {
      router.replace('/parent/progress')
      return
    }
    fetchData()
  }, [bookingId, fetchData, router])

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href="/parent/progress">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Progress
          </Link>
        </Button>
      </div>
    )
  }

  if (!booking || !booking.session || !booking.swimmer) {
    return null
  }

  const session = booking.session
  const swimmer = booking.swimmer
  const startTime = parseISO(session.start_time)
  const endTime = parseISO(session.end_time)

  const workingOnIds = note?.skills_working_on || []
  const masteredIds = note?.skills_mastered || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-4" asChild>
        <Link href="/parent/progress">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Progress
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {swimmer.first_name} {swimmer.last_name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Lesson on {format(startTime, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Session Details
            </CardTitle>
            {swimmer.current_level && (
              <Badge
                className="px-3 py-1"
                style={{
                  backgroundColor: swimmer.current_level.color || 'var(--primary)',
                  color: 'white',
                }}
              >
                <Award className="h-3 w-3 mr-1" />
                {swimmer.current_level.display_name || swimmer.current_level.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
            </div>
            {session.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{session.location}</span>
              </div>
            )}
            {session.instructor?.full_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Instructor: {session.instructor.full_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!note ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Notes Not Yet Available</h3>
            <p className="text-muted-foreground">
              Notes for this session haven&apos;t been added yet. Check back after the lesson.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance &amp; Observation</CardTitle>
              <CardDescription>How your swimmer engaged with the lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <ObservationField
                  label="Attendance"
                  value={formatLabel(ATTENDANCE_LABELS, note.attendance_status)}
                />
                <ObservationField
                  label="Mood"
                  value={formatLabel(MOOD_LABELS, note.swimmer_mood)}
                />
                <ObservationField
                  label="Water Comfort"
                  value={formatLabel(COMFORT_LABELS, note.water_comfort)}
                />
                <ObservationField
                  label="Focus Level"
                  value={formatLabel(FOCUS_LABELS, note.focus_level)}
                />
              </div>
            </CardContent>
          </Card>

          {(masteredIds.length > 0 || workingOnIds.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Skills worked on and mastered this session</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkillList
                  title="Mastered"
                  icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                  emptyText="None this session"
                  ids={masteredIds}
                  skillsById={skillsById}
                />
                <SkillList
                  title="Working On"
                  icon={<Circle className="h-4 w-4 text-yellow-600" />}
                  emptyText="None this session"
                  ids={workingOnIds}
                  skillsById={skillsById}
                />
              </CardContent>
            </Card>
          )}

          {note.lesson_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Lesson Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {note.lesson_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {note.parent_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes for You</CardTitle>
                <CardDescription>A message from your swimmer&apos;s instructor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {note.parent_notes}
                </p>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Note added {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}
            {note.instructor?.full_name ? ` by ${note.instructor.full_name}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

function ObservationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <Badge variant="outline" className="font-medium">
        {value}
      </Badge>
    </div>
  )
}

function SkillList({
  title,
  icon,
  emptyText,
  ids,
  skillsById,
}: {
  title: string
  icon: React.ReactNode
  emptyText: string
  ids: string[]
  skillsById: Record<string, SkillRef>
}) {
  return (
    <div>
      <h4 className="font-medium mb-2">{title}</h4>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {ids.map((id) => {
            const skill = skillsById[id]
            return (
              <li key={id} className="flex items-center gap-2 text-sm">
                {icon}
                <span>{skill?.name || 'Skill'}</span>
                {skill?.level?.display_name && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={
                      skill.level.color
                        ? {
                            backgroundColor: `${skill.level.color}20`,
                            color: skill.level.color,
                            borderColor: `${skill.level.color}40`,
                          }
                        : undefined
                    }
                  >
                    {skill.level.display_name}
                  </Badge>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
