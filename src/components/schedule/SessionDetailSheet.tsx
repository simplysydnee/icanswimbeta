'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInYears } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  UserPlus,
  Calendar,
  MapPin,
  Clock,
  User,
  AlertCircle,
  Activity,
  Stethoscope,
  Pill,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SessionDetail {
  id: string
  start_time: string
  end_time: string
  status: string
  session_type: string
  location: string | null
  instructor_id: string | null
  instructor: {
    full_name: string
    avatar_url: string | null
  } | null
  bookings: Array<{
    id: string
    status: string
    cancel_reason: string | null
    cancel_source: string | null
    canceled_at: string | null
    canceled_by: string | null
    notes: string | null
    swimmer: {
      id: string
      first_name: string
      last_name: string
      date_of_birth: string | null
      diagnosis: string | null
      has_medical_conditions: boolean | null
      medical_conditions_description: string | null
      has_allergies: boolean | null
      allergies_description: string | null
      history_of_seizures: boolean | null
      non_ambulatory: boolean | null
      photo_url: string | null
      enrollment_status: string | null
    } | null
    parent: {
      id: string
      full_name: string
      email: string
      phone: string | null
    } | null
  }>
}

interface Instructor {
  id: string
  full_name: string
}

interface SessionDetailSheetProps {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChange: () => void
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAge(dob: string | null): number | null {
  if (!dob) return null
  return differenceInYears(new Date(), parseISO(dob))
}

function getPacificHourMinute(utcTimeString: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const date = parseISO(utcTimeString)
  const parts = formatter.formatToParts(date)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
  return { hour, minute }
}

function formatPacificTime(utcTimeString: string): string {
  const { hour, minute } = getPacificHourMinute(utcTimeString)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

function formatPacificDate(utcTimeString: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return formatter.format(parseISO(utcTimeString))
}

export function SessionDetailSheet({ sessionId, open, onOpenChange, onDataChange }: SessionDetailSheetProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructors, setInstructors] = useState<Instructor[]>([])

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [newNote, setNewNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Fetch detail when sessionId changes
  useEffect(() => {
    if (!sessionId || !open) {
      setDetail(null)
      return
    }

    const fetchDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/sessions/${sessionId}/detail`)
        if (!response.ok) {
          throw new Error('Failed to load session details')
        }
        const data = await response.json()
        setDetail(data.session)

        // Also fetch instructors for reassign dropdown
        const { data: instructorsData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('display_on_team', true)
          .eq('is_active', true)
          .order('full_name')

        if (instructorsData) {
          setInstructors(instructorsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [sessionId, open, supabase])

  const booking = detail?.bookings?.[0] ?? null
  const swimmer = booking?.swimmer ?? null
  const parent = booking?.parent ?? null
  const hasBooking = !!booking

  // --- Actions ---

  const updateBookingStatus = useCallback(async (status: string, additionalFields?: Record<string, any>) => {
    if (!booking?.id) {
      toast({ title: 'Error', description: 'No booking found for this session', variant: 'destructive' })
      return
    }

    setActionLoading(status)

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalFields }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update')
      }

      toast({ title: 'Success', description: 'Booking status updated' })
      onDataChange()

      // Refresh detail
      const detailRes = await fetch(`/api/sessions/${sessionId}/detail`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setDetail(data.session)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }, [booking?.id, sessionId, onDataChange])

  const handleMarkAttended = useCallback(async () => {
    if (!booking?.id || !sessionId) return
    setActionLoading('attended')

    try {
      // Update booking status
      const bookingRes = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!bookingRes.ok) throw new Error('Failed to update booking')

      // Also close the session slot
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (sessionError) throw sessionError

      toast({ title: 'Success', description: 'Marked as attended' })
      onDataChange()

      const detailRes = await fetch(`/api/sessions/${sessionId}/detail`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setDetail(data.session)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }, [booking?.id, sessionId, supabase, onDataChange])

  const handleLateCancel = useCallback(async () => {
    if (!booking?.id || !sessionId || !cancelReason.trim()) return

    setActionLoading('cancel')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const bookingRes = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancel_reason: cancelReason.trim(),
          cancel_source: 'late_cancel',
          canceled_at: new Date().toISOString(),
          canceled_by: user?.id,
        }),
      })
      if (!bookingRes.ok) throw new Error('Failed to cancel booking')

      toast({ title: 'Success', description: 'Session cancelled' })
      setShowCancelDialog(false)
      setCancelReason('')
      onDataChange()

      const detailRes = await fetch(`/api/sessions/${sessionId}/detail`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setDetail(data.session)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cancel',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }, [booking?.id, sessionId, cancelReason, supabase, onDataChange])

  const handleReassign = useCallback(async (newInstructorId: string) => {
    if (!sessionId) return

    setActionLoading('reassign')

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ instructor_id: newInstructorId })
        .eq('id', sessionId)

      if (error) throw error

      toast({ title: 'Success', description: 'Instructor reassigned' })
      onDataChange()

      const detailRes = await fetch(`/api/sessions/${sessionId}/detail`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setDetail(data.session)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reassign',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }, [sessionId, supabase, onDataChange])

  const handleAddNote = useCallback(async () => {
    if (!booking?.id || !newNote.trim()) return

    setNoteSubmitting(true)

    try {
      const existingNotes = detail?.bookings?.[0]?.notes || ''
      const updatedNotes = existingNotes
        ? `${existingNotes}\n---\n${newNote.trim()}`
        : newNote.trim()

      const { error } = await supabase
        .from('bookings')
        .update({ notes: updatedNotes })
        .eq('id', booking.id)

      if (error) throw error

      toast({ title: 'Success', description: 'Note added' })
      setNewNote('')

      const detailRes = await fetch(`/api/sessions/${sessionId}/detail`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setDetail(data.session)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add note',
        variant: 'destructive',
      })
    } finally {
      setNoteSubmitting(false)
    }
  }, [booking?.id, sessionId, newNote, detail, supabase])

  const getStatusBadge = (bookingStatus: string | undefined) => {
    if (!bookingStatus) return null
    switch (bookingStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Attended</Badge>
      case 'no_show':
        return <Badge className="bg-red-100 text-red-800 border-red-300">No Show</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Cancelled</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Confirmed</Badge>
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-[480px] p-0 flex flex-col"
          side="right"
        >
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center flex-1 text-red-600 p-6">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : detail ? (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Header */}
              <SheetHeader className="px-5 py-4 border-b shrink-0">
                <SheetTitle className="text-lg">Session Details</SheetTitle>
                <SheetDescription>
                  {formatPacificDate(detail.start_time)}
                </SheetDescription>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {/* ===== SWIMMER SECTION ===== */}
                {swimmer ? (
                  <section>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-xl">
                        <AvatarImage src={swimmer.photo_url || undefined} />
                        <AvatarFallback className="rounded-xl bg-[#2a5e84] text-white text-lg">
                          {getInitials(`${swimmer.first_name} ${swimmer.last_name}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900">
                          {swimmer.first_name} {swimmer.last_name}
                        </h3>
                        {swimmer.date_of_birth && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            Age: {getAge(swimmer.date_of_birth)} years
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {swimmer.diagnosis && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                              {swimmer.diagnosis}
                            </Badge>
                          )}
                          {swimmer.history_of_seizures && (
                            <Badge className="text-xs bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Seizure History
                            </Badge>
                          )}
                          {swimmer.non_ambulatory && (
                            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Non-Ambulatory
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical Alert */}
                    {swimmer.has_medical_conditions && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <Stethoscope className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-red-800">Medical Condition{swimmer.medical_conditions_description?.includes(',') ? 's' : ''}</p>
                          <p className="text-sm text-red-700 mt-0.5">{swimmer.medical_conditions_description}</p>
                        </div>
                      </div>
                    )}

                    {/* Allergy Alert */}
                    {swimmer.has_allergies && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                        <Pill className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-800">Allerg{swimmer.allergies_description?.includes(',') ? 'ies' : 'y'}</p>
                          <p className="text-sm text-amber-700 mt-0.5">{swimmer.allergies_description}</p>
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <section>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <User className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">Open Slot</p>
                        <p className="text-sm text-gray-500">No swimmer assigned to this session</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ===== SESSION INFO SECTION ===== */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Session</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900">{formatPacificDate(detail.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900">
                        {formatPacificTime(detail.start_time)} - {formatPacificTime(detail.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900">{detail.location || 'No location set'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900">{detail.instructor?.full_name || 'No instructor'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {detail.session_type === 'assessment' ? 'Assessment' : 'Lesson'}
                      </Badge>
                      {detail.status === 'draft' && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                          Draft
                        </Badge>
                      )}
                      {hasBooking && getStatusBadge(booking.status)}
                    </div>
                  </div>
                </section>

                {/* ===== PARENT CONTACT SECTION ===== */}
                {parent && (
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Parent / Guardian</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-900">{parent.full_name}</p>
                      {parent.email && (
                        <a
                          href={`mailto:${parent.email}`}
                          className="flex items-center gap-2 text-sm text-[#23a1c0] hover:underline"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                          {parent.email}
                        </a>
                      )}
                      {parent.phone && (
                        <a
                          href={`tel:${parent.phone}`}
                          className="flex items-center gap-2 text-sm text-[#23a1c0] hover:underline"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                          {parent.phone}
                        </a>
                      )}
                    </div>
                  </section>
                )}

                {/* ===== NOTES SECTION ===== */}
                {booking?.notes && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                    </div>
                  </section>
                )}

                {/* ===== ACTIONS SECTION ===== */}
                <section className="space-y-3 pb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</h4>
                  <div className="space-y-2.5">
                    {hasBooking ? (
                      <>
                        {/* Mark Attended */}
                        <Button
                          className="w-full h-11 justify-start gap-3 bg-[#7dc842] hover:bg-[#6cb035] text-white"
                          onClick={handleMarkAttended}
                          disabled={actionLoading === 'attended' || booking.status === 'completed'}
                        >
                          {actionLoading === 'attended' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Mark Attended
                        </Button>

                        {/* Mark No-Show */}
                        <Button
                          variant="outline"
                          className="w-full h-11 justify-start gap-3 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => updateBookingStatus('no_show')}
                          disabled={actionLoading === 'no_show' || booking.status !== 'confirmed'}
                        >
                          {actionLoading === 'no_show' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Mark No-Show
                        </Button>

                        {/* Late Cancel */}
                        <Button
                          variant="outline"
                          className="w-full h-11 justify-start gap-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowCancelDialog(true)}
                          disabled={actionLoading === 'cancel' || booking.status !== 'confirmed'}
                        >
                          <Ban className="h-4 w-4" />
                          Late Cancel
                        </Button>
                      </>
                    ) : (
                      /* Floating session / Open Slot */
                      <Button
                        className="w-full h-11 justify-start gap-3 bg-[#23a1c0] hover:bg-[#1c8ba8] text-white"
                        onClick={() => router.push(`/admin/swimmers?assignSession=${detail.id}`)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign Swimmer
                      </Button>
                    )}

                    {/* Reassign Instructor */}
                    {instructors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            onValueChange={handleReassign}
                            disabled={actionLoading === 'reassign'}
                          >
                            <SelectTrigger className="w-full h-11">
                              <SelectValue placeholder={detail.instructor?.full_name || 'Reassign instructor...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors
                                .filter(i => i.id !== detail.instructor_id)
                                .map(instructor => (
                                  <SelectItem key={instructor.id} value={instructor.id}>
                                    {instructor.full_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {actionLoading === 'reassign' && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />
                        )}
                      </div>
                    )}

                    {/* Add Note */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-11 justify-start gap-3"
                        onClick={handleAddNote}
                        disabled={noteSubmitting || !newNote.trim()}
                      >
                        {noteSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        Add Note
                      </Button>
                    </div>

                    {/* View Full Profile */}
                    {swimmer && (
                      <Button
                        variant="ghost"
                        className="w-full h-11 justify-start gap-3 text-[#2a5e84] hover:bg-[#2a5e84]/5"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(`/admin/swimmers/${swimmer.id}`)
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Full Swimmer Profile
                      </Button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Late Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Late Cancel Session</DialogTitle>
            <DialogDescription>
              This will cancel the session and mark it as a late cancellation.
              Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for late cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setCancelReason('')
              }}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleLateCancel}
              disabled={!cancelReason.trim() || actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
