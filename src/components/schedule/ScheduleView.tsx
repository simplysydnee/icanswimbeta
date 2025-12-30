'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Printer,
  Loader2,
  Users,
  UserX,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns'

// Instructor color palette
const INSTRUCTOR_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
]

interface Session {
  id: string
  start_time: string
  end_time: string
  status: string
  session_type: string
  location: string | null
  instructor_id: string | null
  instructor_name: string | null
  instructor_avatar: string | null
  swimmer_name: string | null
  swimmer_id: string | null
  parent_email: string | null
  booking_id: string | null
}

interface Instructor {
  id: string
  full_name: string
  avatar_url: string | null
  colorIndex: number
}

interface ScheduleViewProps {
  role: 'admin' | 'instructor'
  userId?: string // For instructor role - filter to their sessions only
}

export function ScheduleView({ role, userId }: ScheduleViewProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [view, setView] = useState<'day' | 'week'>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  // Admin action states
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [showCancelDayDialog, setShowCancelDayDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedInstructorForCancel, setSelectedInstructorForCancel] = useState<Instructor | null>(null)
  const [newInstructorId, setNewInstructorId] = useState<string>('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Filter states
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('all')
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all')
  const [availableLocations] = useState<string[]>(['Modesto', 'Turlock'])
  const [isTransferMode, setIsTransferMode] = useState(false)

  // Time slots (6 AM to 8 PM)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Fetch instructors
  const fetchInstructors = useCallback(async () => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor')

    if (roleData && roleData.length > 0) {
      const instructorIds = roleData.map(r => r.user_id)

      // If instructor role, only fetch their own profile
      const query = supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name')

      if (role === 'instructor' && userId) {
        query.eq('id', userId)
      } else {
        query.in('id', instructorIds)
      }

      const { data: profiles } = await query

      if (profiles) {
        setInstructors(profiles.map((p, idx) => ({
          ...p,
          colorIndex: idx % INSTRUCTOR_COLORS.length
        })))
      }
    }
  }, [supabase, role, userId])

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true)

    let startDate: Date, endDate: Date

    if (view === 'day') {
      startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
      endDate = addDays(startDate, 6)
      endDate.setHours(23, 59, 59, 999)
    }

    let query = supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        status,
        session_type,
        location,
        instructor_id,
        instructor:profiles!instructor_id(full_name, avatar_url),
        bookings(
          id,
          swimmer:swimmers(id, first_name, last_name, parent_id),
          parent:profiles!parent_id(email)
        )
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .neq('status', 'cancelled')
      .order('start_time')

    // Filter by instructor if instructor role
    if (role === 'instructor' && userId) {
      query = query.eq('instructor_id', userId)
    }

    const { data, error } = await query

    if (error) {
      toast({ title: 'Error', description: 'Failed to load sessions', variant: 'destructive' })
      console.error(error)
    } else if (data) {
      const formatted: Session[] = data.map((s) => {
        // Handle instructor data which might be an array or object
        const instructor = Array.isArray(s.instructor) ? s.instructor[0] : s.instructor
        const bookings = s.bookings || []
        const firstBooking = bookings[0]

        return {
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          status: s.status,
          session_type: s.session_type,
          location: s.location,
          instructor_id: s.instructor_id,
          instructor_name: instructor?.full_name || null,
          instructor_avatar: instructor?.avatar_url || null,
          swimmer_name: firstBooking?.swimmer
            ? `${firstBooking.swimmer.first_name} ${firstBooking.swimmer.last_name}`
            : null,
          swimmer_id: firstBooking?.swimmer?.id || null,
          parent_email: firstBooking?.parent?.email || null,
          booking_id: firstBooking?.id || null,
        }
      })
      setSessions(formatted)
    }
    setLoading(false)
  }, [supabase, currentDate, view, role, userId, toast])

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Navigation
  const goToToday = () => setCurrentDate(new Date())
  const goToPrevious = () => setCurrentDate(prev => view === 'day' ? subDays(prev, 1) : subWeeks(prev, 1))
  const goToNext = () => setCurrentDate(prev => view === 'day' ? addDays(prev, 1) : addWeeks(prev, 1))

  // Get sessions for slot
  const getSessionsForSlot = (instructorId: string, timeSlot: string) => {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)

    return sessions.filter(session => {
      if (session.instructor_id !== instructorId) return false

      // Apply filters
      if (selectedInstructorFilter !== 'all' && session.instructor_id !== selectedInstructorFilter) return false
      if (selectedLocationFilter !== 'all' && session.location !== selectedLocationFilter) return false

      const sessionStart = parseISO(session.start_time)
      return sessionStart.getHours() === slotHour &&
             Math.floor(sessionStart.getMinutes() / 30) === Math.floor(slotMinute / 30)
    })
  }

  // Get filtered instructors based on current filters
  const filteredInstructors = useMemo(() => {
    if (selectedInstructorFilter === 'all') {
      return instructors
    }
    return instructors.filter(instructor => instructor.id === selectedInstructorFilter)
  }, [instructors, selectedInstructorFilter])

  // Check if there are substitute instructors available for a given day
  const hasSubstituteInstructors = useCallback((instructorId: string) => {
    // For now, we'll assume there are substitutes if there are other instructors
    // In a real implementation, you would check a database table for substitute availability
    return instructors.filter(i => i.id !== instructorId).length > 0
  }, [instructors])


  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Admin Actions
  const handleReassignSession = (session: Session) => {
    setSelectedSession(session)
    setNewInstructorId('')
    setShowReassignDialog(true)
  }

  const handleCancelInstructorDay = (instructor: Instructor) => {
    setSelectedInstructorForCancel(instructor)
    setCancelReason('')
    setIsTransferMode(false)
    setShowCancelDayDialog(true)
  }

  // Handle transfer day to substitute instructor
  const handleTransferInstructorDay = (instructor: Instructor) => {
    setSelectedInstructorForCancel(instructor)
    setCancelReason('')
    setIsTransferMode(true)
    setShowCancelDayDialog(true)
  }

  const confirmReassign = async () => {
    if (!selectedSession || !newInstructorId) return

    setActionLoading(true)
    const { error } = await supabase
      .from('sessions')
      .update({ instructor_id: newInstructorId })
      .eq('id', selectedSession.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to reassign session', variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Session reassigned' })
      setShowReassignDialog(false)
      fetchSessions()
    }
    setActionLoading(false)
  }

  const confirmCancelDay = async () => {
    if (!selectedInstructorForCancel || !cancelReason) return

    setActionLoading(true)

    // Get all sessions for this instructor today
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const instructorSessions = sessions.filter(s =>
      s.instructor_id === selectedInstructorForCancel.id
    )

    // Cancel all sessions and collect parent emails
    const parentEmails: string[] = []
    const swimmerNames: string[] = []

    for (const session of instructorSessions) {
      // Update session status
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id)

      // If there's a booking, cancel it and collect parent info
      if (session.booking_id) {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancel_reason: cancelReason,
            cancel_source: 'admin',
            canceled_at: new Date().toISOString()
          })
          .eq('id', session.booking_id)

        if (session.parent_email) {
          parentEmails.push(session.parent_email)
        }
        if (session.swimmer_name) {
          swimmerNames.push(session.swimmer_name)
        }
      }
    }

    // Send cancellation emails to parents
    if (parentEmails.length > 0) {
      try {
        await fetch('/api/email/send-cancellation-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentEmails,
            instructorName: selectedInstructorForCancel.full_name,
            date: format(currentDate, 'EEEE, MMMM d, yyyy'),
            reason: cancelReason,
            swimmerNames
          })
        })
      } catch (err) {
        console.error('Failed to send cancellation emails:', err)
      }
    }

    toast({
      title: 'Sessions Cancelled',
      description: `Cancelled ${instructorSessions.length} sessions. ${parentEmails.length} parents notified.`
    })

    setShowCancelDayDialog(false)
    fetchSessions()
    setActionLoading(false)
  }

  const confirmTransferDay = async () => {
    if (!selectedInstructorForCancel || !cancelReason || !newInstructorId) return

    setActionLoading(true)

    // Get all sessions for this instructor today
    const instructorSessions = sessions.filter(s =>
      s.instructor_id === selectedInstructorForCancel.id
    )

    // Transfer all sessions to new instructor
    for (const session of instructorSessions) {
      // Update session instructor
      await supabase
        .from('sessions')
        .update({ instructor_id: newInstructorId })
        .eq('id', session.id)

      // If there's a booking, send notification to parent
      if (session.booking_id && session.parent_email) {
        try {
          await fetch('/api/email/send-transfer-notice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentEmail: session.parent_email,
              swimmerName: session.swimmer_name,
              oldInstructorName: selectedInstructorForCancel.full_name,
              newInstructorName: instructors.find(i => i.id === newInstructorId)?.full_name || 'Substitute Instructor',
              date: format(parseISO(session.start_time), 'EEEE, MMMM d, yyyy'),
              time: format(parseISO(session.start_time), 'h:mm a'),
              reason: cancelReason
            })
          })
        } catch (err) {
          console.error('Failed to send transfer notification:', err)
        }
      }
    }

    toast({
      title: 'Sessions Transferred',
      description: `Transferred ${instructorSessions.length} sessions to substitute instructor.`
    })

    setShowCancelDayDialog(false)
    fetchSessions()
    setActionLoading(false)
  }

  const handlePrint = () => window.print()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-full mx-auto overflow-x-hidden" id="schedule-content">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'admin' ? 'Staff Schedule' : 'My Schedule'}
          </h1>
          <p className="text-gray-600">
            {role === 'admin' ? 'View and manage all instructor schedules' : 'View your upcoming sessions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters (Admin only) */}
      {role === 'admin' && (
        <div className="flex flex-wrap gap-4 mb-6 print:hidden">
          <div className="flex flex-col gap-1">
            <Label htmlFor="instructor-filter" className="text-sm font-medium">Instructor</Label>
            <Select value={selectedInstructorFilter} onValueChange={setSelectedInstructorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Instructors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                {instructors.map(instructor => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="location-filter" className="text-sm font-medium">Location</Label>
            <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {availableLocations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block print-header">
        <h1>I Can Swim - {role === 'admin' ? 'Staff' : 'My'} Schedule</h1>
        <p>
          {view === 'day'
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}`
          }
        </p>
        {selectedInstructorFilter !== 'all' && (
          <p className="text-xs">Instructor: {instructors.find(i => i.id === selectedInstructorFilter)?.full_name}</p>
        )}
        {selectedLocationFilter !== 'all' && (
          <p className="text-xs">Location: {selectedLocationFilter}</p>
        )}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-lg font-semibold">
            {view === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}`
            }
          </span>
        </div>
      </div>

      {/* Instructor Legend (Admin only with multiple instructors) */}
      {role === 'admin' && filteredInstructors.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {filteredInstructors.map((instructor) => {
            const color = INSTRUCTOR_COLORS[instructor.colorIndex]
            const hasSubstitutes = hasSubstituteInstructors(instructor.id)
            return (
              <div key={instructor.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border-2`} />
                <span className="text-sm font-medium">{instructor.full_name}</span>
                {/* Admin: Cancel or Transfer all for this instructor */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 print:hidden"
                    onClick={() => handleCancelInstructorDay(instructor)}
                    title="Cancel all sessions for this instructor"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                  {hasSubstitutes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 print:hidden"
                      onClick={() => handleTransferInstructorDay(instructor)}
                      title="Transfer all sessions to substitute instructor"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {role === 'admin' ? 'No active instructors found' : 'No schedule found'}
              </p>
            </div>
          ) : view === 'day' ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left w-24 text-sm font-semibold sticky left-0 bg-gray-50">Time</th>
                  {filteredInstructors.map((instructor) => {
                    const color = INSTRUCTOR_COLORS[instructor.colorIndex]
                    return (
                      <th key={instructor.id} className="border p-2 text-center min-w-[150px] md:min-w-[180px]">
                        <div className="flex flex-col items-center gap-1">
                          <Avatar className="h-8 w-8 print:hidden">
                            <AvatarImage src={instructor.avatar_url || undefined} />
                            <AvatarFallback className={`${color.bg} ${color.text} text-xs`}>
                              {getInitials(instructor.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold">{instructor.full_name}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot} className="hover:bg-gray-50">
                    <td className="border p-2 text-sm font-medium text-gray-600 sticky left-0 bg-white">
                      {format(new Date(`2000-01-01T${slot}:00`), 'h:mm a')}
                    </td>
                    {filteredInstructors.map((instructor) => {
                      const slotSessions = getSessionsForSlot(instructor.id, slot)
                      const color = INSTRUCTOR_COLORS[instructor.colorIndex]

                      return (
                        <td key={`${instructor.id}-${slot}`} className="border p-1 align-top">
                          {slotSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`${color.bg} ${color.border} border-l-4 rounded p-2 mb-1 group relative`}
                            >
                              <p className={`text-sm font-semibold ${color.text}`}>
                                {session.swimmer_name || 'Open Slot'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {format(parseISO(session.start_time), 'h:mm')} - {format(parseISO(session.end_time), 'h:mm a')}
                              </p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {session.session_type === 'assessment' ? 'Assessment' : 'Lesson'}
                                </Badge>
                                {session.location && (
                                  <Badge variant="secondary" className="text-xs">
                                    {session.location}
                                  </Badge>
                                )}
                              </div>

                              {/* Admin: Reassign button */}
                              {role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                  onClick={() => handleReassignSession(session)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px] md:min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left w-24 md:w-28 text-sm font-semibold sticky left-0 bg-gray-50">Day</th>
                    {filteredInstructors.map((instructor) => {
                      const color = INSTRUCTOR_COLORS[instructor.colorIndex]
                      return (
                        <th key={instructor.id} className="border p-2 text-center min-w-[120px] md:min-w-[150px]">
                          <div className="flex flex-col items-center gap-1">
                            <Avatar className="h-5 w-5 md:h-6 md:w-6 print:hidden">
                              <AvatarImage src={instructor.avatar_url || undefined} />
                              <AvatarFallback className={`${color.bg} ${color.text} text-xs`}>
                                {getInitials(instructor.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold truncate max-w-[100px]">{instructor.full_name}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
                    const dayName = format(day, 'EEE')
                    const dayDate = format(day, 'MMM d')
                    const isToday = isSameDay(day, new Date())

                    const daySessions = sessions.filter(s =>
                      isSameDay(parseISO(s.start_time), day)
                    )

                    return (
                      <tr key={i} className={isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className={`border p-2 sticky left-0 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {dayName}
                          </div>
                          <div className="text-xs text-gray-500">{dayDate}</div>
                        </td>

                        {filteredInstructors.map((instructor) => {
                          const instructorDaySessions = daySessions
                            .filter(s => s.instructor_id === instructor.id)
                            .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
                          const color = INSTRUCTOR_COLORS[instructor.colorIndex]

                          return (
                            <td key={instructor.id} className="border p-1 align-top">
                              {instructorDaySessions.length === 0 ? (
                                <div className="text-xs text-gray-300 text-center py-4">—</div>
                              ) : (
                                <div className="space-y-1">
                                  {instructorDaySessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className={`${color.bg} ${color.border} border-l-2 rounded p-1.5 text-xs group relative cursor-pointer hover:shadow-sm`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className={`font-semibold ${color.text}`}>
                                          {format(parseISO(session.start_time), 'h:mm a')}
                                        </span>
                                        {role === 'admin' && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 print:hidden"
                                            onClick={() => handleReassignSession(session)}
                                          >
                                            <RefreshCw className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-gray-700 truncate font-medium">
                                        {session.swimmer_name || 'Open'}
                                      </p>
                                      <div className="flex gap-1 mt-1">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          {session.session_type === 'assessment' ? 'Assess' : 'Lesson'}
                                        </Badge>
                                        {session.location && (
                                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                            {session.location}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reassign Session Dialog (Admin only) */}
      {role === 'admin' && (
        <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Session</DialogTitle>
              <DialogDescription>
                Reassign this session to a different instructor.
              </DialogDescription>
            </DialogHeader>

            {selectedSession && (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedSession.swimmer_name || 'Open Slot'}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(selectedSession.start_time), 'h:mm a')} - {format(parseISO(selectedSession.end_time), 'h:mm a')}
                  </p>
                  <p className="text-sm text-gray-500">Currently: {selectedSession.instructor_name}</p>
                </div>

                <div>
                  <Label>New Instructor</Label>
                  <Select value={newInstructorId} onValueChange={setNewInstructorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors
                        .filter(i => i.id !== selectedSession.instructor_id)
                        .map(instructor => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReassignDialog(false)}>Cancel</Button>
              <Button
                onClick={confirmReassign}
                disabled={!newInstructorId || actionLoading}
                className="bg-[#2a5e84] hover:bg-[#1e4a6d]"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Reassign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel/Transfer Day Dialog (Admin only) */}
      {role === 'admin' && (
        <Dialog open={showCancelDayDialog} onOpenChange={setShowCancelDayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isTransferMode ? (
                  <>
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    Transfer All Sessions
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Cancel All Sessions
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {isTransferMode ? (
                  <>Transfer all of {selectedInstructorForCancel?.full_name}&apos;s sessions for {format(currentDate, 'MMMM d, yyyy')} to a substitute instructor.</>
                ) : (
                  <>Cancel all of {selectedInstructorForCancel?.full_name}&apos;s sessions for {format(currentDate, 'MMMM d, yyyy')}. Parents will be notified by email.</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className={`${isTransferMode ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border p-3 rounded-lg`}>
                <p className={`text-sm ${isTransferMode ? 'text-blue-800' : 'text-red-800'}`}>
                  {isTransferMode ? (
                    <>This will transfer {sessions.filter(s => s.instructor_id === selectedInstructorForCancel?.id).length} session(s) to a substitute instructor.</>
                  ) : (
                    <>This will cancel {sessions.filter(s => s.instructor_id === selectedInstructorForCancel?.id).length} session(s) and notify affected parents.</>
                  )}
                </p>
              </div>

              {isTransferMode && (
                <div>
                  <Label>Transfer To (Substitute Instructor)</Label>
                  <Select value={newInstructorId} onValueChange={setNewInstructorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select substitute instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors
                        .filter(i => i.id !== selectedInstructorForCancel?.id)
                        .map(instructor => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="cancelReason">{isTransferMode ? 'Reason for Transfer *' : 'Reason for Cancellation *'}</Label>
                <Textarea
                  id="cancelReason"
                  placeholder={isTransferMode ? "e.g., Instructor unavailable, schedule conflict, etc." : "e.g., Staff illness, emergency, etc."}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isTransferMode ? 'This will be included in the notification to parents' : 'This will be included in the email to parents'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDayDialog(false)}>Keep Sessions</Button>
              <Button
                variant={isTransferMode ? "default" : "destructive"}
                onClick={isTransferMode ? confirmTransferDay : confirmCancelDay}
                disabled={!cancelReason || (isTransferMode && !newInstructorId) || actionLoading}
                className={isTransferMode ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isTransferMode ? 'Transfer All Sessions' : 'Cancel All & Notify Parents'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Styles for One-Page Laminated Schedule */}
      <style jsx global>{`
        @media print {
          /* Hide everything except schedule content */
          body * { visibility: hidden; }
          #schedule-content, #schedule-content * { visibility: visible; }
          #schedule-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide non-essential elements */
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }

          /* Optimize table for one-page printing */
          table {
            font-size: 9px !important;
            border-collapse: collapse;
            width: 100%;
            page-break-inside: avoid;
          }

          th, td {
            padding: 2px 3px !important;
            border: 1px solid #ccc !important;
            vertical-align: top;
          }

          /* Compact header */
          th {
            background-color: #f8f9fa !important;
            font-weight: bold;
            height: 40px;
          }

          /* Time column styling */
          td:first-child {
            background-color: #f8f9fa !important;
            font-weight: bold;
            width: 50px;
            position: sticky;
            left: 0;
            z-index: 10;
          }

          /* Instructor columns */
          th:not(:first-child) {
            min-width: 120px;
          }

          /* Session cards */
          .border-l-4 {
            border-left-width: 3px !important;
            padding: 3px !important;
            margin-bottom: 2px !important;
          }

          /* Badges */
          .text-xs {
            font-size: 7px !important;
            padding: 1px 3px !important;
            margin: 1px !important;
          }

          /* Remove avatars and buttons in print */
          .avatar, button, .group-hover\\:opacity-100 {
            display: none !important;
          }

          /* Print header */
          .print-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
          }

          .print-header h1 {
            font-size: 16px !important;
            margin: 0 0 5px 0;
          }

          .print-header p {
            font-size: 12px !important;
            margin: 0;
            color: #666;
          }

          /* Force single page */
          @page {
            size: letter portrait;
            margin: 0.5in;
          }

          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}