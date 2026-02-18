'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { format, isAfter, isBefore } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageCircle
} from 'lucide-react'
import { InstructorAvatar } from '@/components/ui/instructor-avatar'

interface Session {
  id: string
  start_time: string
  end_time: string
  location: string
  batch_id: string | null
  instructor: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  funding_source_id: string | null
}

interface Booking {
  id: string
  status: string
  booking_type: string
  created_at: string
  session: Session
  swimmer: Swimmer
}

interface GroupedBookings {
  batchId: string | null
  swimmerName: string
  swimmerId: string
  bookings: Booking[]
  firstSession: Date
  canCancelBlock: boolean
}

export default function ParentSessionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelBlockData, setCancelBlockData] = useState<GroupedBookings | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showBlockCancelDialog, setShowBlockCancelDialog] = useState(false)
  const [showLateMessage, setShowLateMessage] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          booking_type,
          created_at,
          session:sessions (
            id,
            start_time,
            end_time,
            location,
            batch_id,
            instructor:profiles!instructor_id (
              id,
              full_name,
              avatar_url
            )
          ),
          swimmer:swimmers (
            id,
            first_name,
            last_name,
            funding_source_id
          )
        `)
        .eq('parent_id', user.id)
        .in('status', ['confirmed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Filter out bookings with null sessions
      const validBookings = (data || []).filter(
        (b): b is Booking => b.session !== null && b.swimmer !== null
      )
      setBookings(validBookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase, toast])

  useEffect(() => {
    fetchBookings()
  }, [user, fetchBookings])

  // Group bookings by batch for recurring sessions
  const groupedBookings = (): GroupedBookings[] => {
    const groups: Map<string, GroupedBookings> = new Map()
    const now = new Date()

    bookings
      .filter(b => b.status === 'confirmed')
      .forEach(booking => {
        const key = booking.session.batch_id
          ? `${booking.swimmer.id}-${booking.session.batch_id}`
          : `single-${booking.id}`

        if (!groups.has(key)) {
          groups.set(key, {
            batchId: booking.session.batch_id,
            swimmerName: `${booking.swimmer.first_name} ${booking.swimmer.last_name}`,
            swimmerId: booking.swimmer.id,
            bookings: [],
            firstSession: new Date(booking.session.start_time),
            canCancelBlock: true,
          })
        }

        const group = groups.get(key)!
        group.bookings.push(booking)

        const sessionDate = new Date(booking.session.start_time)
        if (sessionDate < group.firstSession) {
          group.firstSession = sessionDate
        }
      })

    // Sort bookings within each group and determine if block can be canceled
    groups.forEach(group => {
      group.bookings.sort((a, b) =>
        new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
      )
      // Can only cancel block if first session hasn't started yet
      group.canCancelBlock = group.batchId !== null && isAfter(group.firstSession, now)
    })

    return Array.from(groups.values()).sort((a, b) =>
      a.firstSession.getTime() - b.firstSession.getTime()
    )
  }

  const canCancelSingle = (booking: Booking): {
    canCancel: boolean
    isLateCancel: boolean
    hoursLeft: number
    reason: string
  } => {
    const sessionStart = new Date(booking.session.start_time)
    const now = new Date()
    const hoursUntil = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (isBefore(sessionStart, now)) {
      return { canCancel: false, isLateCancel: false, hoursLeft: 0, reason: 'Session has already occurred' }
    }

    if (hoursUntil < 24) {
      return {
        canCancel: false,
        isLateCancel: true,
        hoursLeft: Math.round(hoursUntil),
        reason: 'Less than 24 hours - please text us'
      }
    }

    return { canCancel: true, isLateCancel: false, hoursLeft: Math.round(hoursUntil), reason: '' }
  }

  const handleCancelSingle = async () => {
    if (!selectedBooking) return

    setCancelingId(selectedBooking.id)
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'late_cancellation') {
          setShowCancelDialog(false)
          setShowLateMessage(true)
          return
        }
        throw new Error(result.error || 'Failed to cancel')
      }

      toast({
        title: 'Session Cancelled ✓',
        description: 'Your session has been cancelled successfully.',
      })

      setShowCancelDialog(false)
      setCancelReason('')
      setSelectedBooking(null)
      fetchBookings()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel'
      toast({
        title: 'Cancel Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCancelingId(null)
    }
  }

  const handleCancelBlock = async () => {
    if (!cancelBlockData) return

    setCancelingId('block')
    try {
      const response = await fetch('/api/bookings/cancel-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swimmerId: cancelBlockData.swimmerId,
          batchId: cancelBlockData.batchId,
          reason: cancelReason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel block')
      }

      toast({
        title: 'Sessions Cancelled ✓',
        description: `Cancelled ${result.results.canceled} sessions`,
      })

      setShowBlockCancelDialog(false)
      setCancelReason('')
      setCancelBlockData(null)
      fetchBookings()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel'
      toast({
        title: 'Cancel Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCancelingId(null)
    }
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'confirmed' && isAfter(new Date(b.session.start_time), new Date())
  )

  const pastBookings = bookings.filter(
    b => b.status === 'confirmed' && isBefore(new Date(b.session.start_time), new Date())
  )

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  return (
    <RoleGuard allowedRoles={['parent']}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600">View and manage your swim lesson bookings</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
              </div>
            ) : groupedBookings().length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming sessions</p>
                  <Button
                    className="mt-4 bg-[#2a5e84] hover:bg-[#1e4a6d]"
                    onClick={() => window.location.href = '/parent/book'}
                  >
                    Book a Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {groupedBookings().map((group, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {group.swimmerName}
                            {group.batchId && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Recurring ({group.bookings.length} sessions)
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {group.batchId
                              ? `Block starts ${format(group.firstSession, 'MMM d, yyyy')}`
                              : format(group.firstSession, 'EEEE, MMMM d, yyyy')}
                          </CardDescription>
                        </div>

                        {/* Block Cancel Button - only show if can cancel and has multiple sessions */}
                        {group.canCancelBlock && group.bookings.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => {
                              setCancelBlockData(group)
                              setShowBlockCancelDialog(true)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel All
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.bookings.map((booking) => {
                          const { canCancel, isLateCancel, hoursLeft } = canCancelSingle(booking)
                          const isPast = isBefore(new Date(booking.session.start_time), new Date())

                          return (
                            <div
                              key={booking.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isPast ? 'bg-gray-50 opacity-60' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <InstructorAvatar
                                  name={booking.session.instructor?.full_name || 'TBD'}
                                  avatarUrl={booking.session.instructor?.avatar_url}
                                  size="sm"
                                  showName={false}
                                />
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-[#2a5e84]" />
                                    {format(new Date(booking.session.start_time), 'EEE, MMM d')}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(booking.session.start_time), 'h:mm a')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {booking.session.location || 'TBD'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {!isPast && (
                                <div className="flex items-center gap-2">
                                  {canCancel ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedBooking(booking)
                                        setShowCancelDialog(true)
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  ) : isLateCancel ? (
                                    <div className="text-right">
                                      <p className="text-xs text-amber-600 font-medium">
                                        Need to cancel? ({hoursLeft}h left)
                                      </p>
                                      <a
                                        href="sms:2096437969"
                                        className="text-xs text-[#2a5e84] underline flex items-center gap-1 justify-end"
                                      >
                                        <MessageCircle className="h-3 w-3" />
                                        Text (209) 643-7969
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Past</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past Sessions */}
          <TabsContent value="past" className="mt-6">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No past sessions yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {pastBookings.slice(0, 20).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {booking.swimmer.first_name} {booking.swimmer.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(booking.session.start_time), 'MMM d, yyyy')} at {format(new Date(booking.session.start_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                      Completed
                    </Badge>
                  </div>
                ))}
                {pastBookings.length > 20 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    Showing most recent 20 sessions
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Cancelled Sessions */}
          <TabsContent value="cancelled" className="mt-6">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No cancelled sessions
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {cancelledBookings.slice(0, 20).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-sm">
                          {booking.swimmer.first_name} {booking.swimmer.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Was scheduled: {format(new Date(booking.session.start_time), 'MMM d, yyyy')} at {format(new Date(booking.session.start_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-600 text-xs">
                      Cancelled
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Single Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this session?
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>Swimmer:</strong> {selectedBooking.swimmer.first_name} {selectedBooking.swimmer.last_name}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedBooking.session.start_time), 'EEEE, MMMM d, yyyy')}</p>
                  <p><strong>Time:</strong> {format(new Date(selectedBooking.session.start_time), 'h:mm a')}</p>
                  <p><strong>Location:</strong> {selectedBooking.session.location || 'TBD'}</p>
                </div>

                <div className="mt-4">
                  <Label htmlFor="reason">Reason for cancellation (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Let us know why you're cancelling..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false)
                  setSelectedBooking(null)
                  setCancelReason('')
                }}
              >
                Keep Session
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSingle}
                disabled={cancelingId === selectedBooking?.id}
              >
                {cancelingId === selectedBooking?.id && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Cancel Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Cancel Dialog */}
        <AlertDialog open={showBlockCancelDialog} onOpenChange={setShowBlockCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cancel All Sessions?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>This will cancel all <strong>{cancelBlockData?.bookings.length}</strong> upcoming sessions for <strong>{cancelBlockData?.swimmerName}</strong>.</p>
                  <p className="mt-2 text-amber-600">This action cannot be undone.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <Label htmlFor="block_reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="block_reason"
                placeholder="Let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setCancelBlockData(null)
                setCancelReason('')
              }}>
                Keep Sessions
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBlock}
                className="bg-red-600 hover:bg-red-700"
                disabled={cancelingId === 'block'}
              >
                {cancelingId === 'block' && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Cancel All ({cancelBlockData?.bookings.length})
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Late Cancellation Message Dialog */}
        <Dialog open={showLateMessage} onOpenChange={setShowLateMessage}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Less Than 24 Hours Notice
              </DialogTitle>
              <DialogDescription>Information about late cancellation policy</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-gray-600 mb-4">
                We understand life happens! For cancellations with less than 24 hours notice,
                please text us directly so we can try to help.
              </p>

              <div className="bg-[#2a5e84]/10 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Text us at:</p>
                <a
                  href="sms:2096437969"
                  className="text-2xl font-bold text-[#2a5e84] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-6 w-6" />
                  (209) 643-7969
                </a>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                We&apos;ll do our best to accommodate your request and may be able to
                offer the spot to another swimmer.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowLateMessage(false)} className="bg-[#2a5e84] hover:bg-[#1e4a6d]">
                Got It
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}