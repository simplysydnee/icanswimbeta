'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PendingEnrollmentAlert } from '@/components/dashboard/PendingEnrollmentAlert'
import { PendingParentReferrals } from '@/components/dashboard/PendingParentReferrals'
import { PendingWaiverAlert } from '@/components/dashboard/PendingWaiverAlert'
import { PendingInvitations } from '@/components/parent/PendingInvitations'
import Link from 'next/link'
import { Plus, Calendar, Users, ChevronRight, X, Clock, MapPin, User, AlertCircle, Phone, MessageSquare } from 'lucide-react'
import { format, parseISO, differenceInHours } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  enrollment_status: string
  assessment_status?: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
  funding_source?: {
    id: string
    name: string
    requires_authorization: boolean
  }
  has_active_po?: boolean
}

interface Booking {
  id: string
  status: string
  purchase_order_id?: string | null
  purchase_order?: {
    is_extension: boolean
    sessions_authorized: number
    sessions_used: number
  } | null
  session: {
    id: string
    start_time: string
    end_time: string
    location: string
    session_type?: string
    instructor?: {
      full_name?: string
    }
  }
  swimmer: {
    id: string
    first_name: string
    last_name: string
  }
}

export default function ParentDashboard() {
  const router = useRouter()
  const { user, profile, role, loading: authLoading, isLoadingProfile } = useAuth()
  const { toast } = useToast()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)
  const [showLateCancelMessage, setShowLateCancelMessage] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // Fetch parent's swimmers with additional data
      const { data: swimmersData, error: swimmersError } = await supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          enrollment_status,
          assessment_status,
          current_level:swim_levels(name, display_name, color),
          funding_source:funding_sources(id, name, requires_authorization)
        `)
        .eq('parent_id', user.id)
        .order('first_name')

      if (swimmersError) {
        console.error('Error fetching swimmers:', swimmersError)
        // Continue with empty swimmers array
      } else {
        // Check for active purchase orders for each swimmer
        const swimmersWithPO = await Promise.all(
          (swimmersData || []).map(async (swimmer) => {
            const { data: poData } = await supabase
              .from('purchase_orders')
              .select('id')
              .eq('swimmer_id', swimmer.id)
              .eq('status', 'active')
              .eq('po_type', 'lessons')
              .limit(1)

            return {
              ...swimmer,
              has_active_po: !!poData && poData.length > 0
            }
          })
        )

        setSwimmers(swimmersWithPO || [])
      }

      // Fetch upcoming bookings with session_type
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            purchase_order_id,
            purchase_order:purchase_orders(
              is_extension,
              sessions_authorized,
              sessions_used
            ),
            session:sessions(
              id,
              start_time,
              end_time,
              location,
              session_type,
              instructor:profiles(full_name)
            ),
            swimmer:swimmers(id, first_name, last_name)
          `)
          .eq('parent_id', user.id)
          .in('status', ['confirmed', 'pending_auth'])

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError)
          // Continue with empty bookings array
        } else {
          // Filter to upcoming bookings client-side
          const now = new Date()
          const upcomingBookings = (bookingsData || [])
            .filter(b => b.session && new Date(b.session.start_time) >= now)
            .sort((a, b) =>
              new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
            )
          setBookings(upcomingBookings)
        }
      } catch (error) {
        console.error('Error in bookings fetch:', error)
        // Continue with empty bookings array
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper functions
  const getSwimmerInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEE, MMM d')
  }

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a')
  }

  const getSessionTypeBadge = (sessionType?: string) => {
    if (sessionType === 'assessment') {
      return <Badge className="bg-[#7dc842] text-white border-[#7dc842]">Assessment</Badge>
    }
    return <Badge className="bg-[#23a1c0] text-white border-[#23a1c0]">Lesson</Badge>
  }

  const getLevelColor = (levelName?: string) => {
    const colorMap: Record<string, string> = {
      'white': 'bg-gray-100 text-gray-800 border-gray-200',
      'red': 'bg-red-100 text-red-800 border-red-200',
      'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'green': 'bg-green-100 text-green-800 border-green-200',
      'blue': 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return colorMap[levelName?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEnrollmentStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'waitlist': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_enrollment': 'bg-gray-100 text-gray-800 border-gray-200',
      'pending': 'bg-blue-100 text-blue-800 border-blue-200',
      'enrolled': 'bg-green-100 text-green-800 border-green-200',
      'dropped': 'bg-red-100 text-red-800 border-red-200',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEnrollmentStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'waitlist': 'Waitlist',
      'pending_enrollment': 'Pending',
      'pending': 'Pending',
      'enrolled': 'Enrolled',
      'dropped': 'Dropped',
    }
    return statusMap[status] || status
  }

  const canCancelBooking = (startTime: string) => {
    const sessionStart = parseISO(startTime)
    const now = new Date()
    const hoursUntil = differenceInHours(sessionStart, now)
    return hoursUntil > 24
  }

  const handleCancelBooking = async (bookingId: string) => {
    setCancelingBookingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Parent cancelled from dashboard' }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'late_cancellation') {
          setShowCancelConfirm(null)
          setShowLateCancelMessage(bookingId)
          return
        }
        throw new Error(result.error || 'Failed to cancel')
      }

      toast({
        title: 'Lesson Cancelled',
        description: 'Your lesson has been cancelled successfully.',
      })

      setShowCancelConfirm(null)
      fetchData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel'
      toast({
        title: 'Cancel Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCancelingBookingId(null)
    }
  }

  // Helper to determine per-swimmer empty state action
  const getSwimmerEmptyAction = (swimmer: Swimmer) => {
    // Waitlist swimmers — no lesson-related language
    if (swimmer.enrollment_status === 'waitlist') {
      if (swimmer.assessment_status === 'not_scheduled' || swimmer.assessment_status === 'not_started') {
        return {
          title: 'Awaiting Initial Assessment',
          buttonText: `Book ${swimmer.first_name}'s Assessment`,
          buttonHref: `/parent/book?swimmerId=${swimmer.id}&type=assessment`,
          description: '',
          showButton: true,
        }
      }
      if (swimmer.funding_source?.requires_authorization) {
        return {
          title: 'Awaiting Authorization',
          buttonText: '',
          buttonHref: '',
          description: "We'll notify you when lessons are ready to book",
          showButton: false,
        }
      }
      return {
        title: 'Awaiting Enrollment',
        description: "We'll notify you when enrollment is complete",
        buttonText: '',
        buttonHref: '',
        showButton: false,
      }
    }

    // Enrolled / non-waitlist swimmers
    if (swimmer.assessment_status === 'not_scheduled' || swimmer.assessment_status === 'not_started') {
      return {
        title: "Hasn't had their assessment yet",
        buttonText: `Book an assessment for ${swimmer.first_name}`,
        buttonHref: `/parent/book?swimmerId=${swimmer.id}&type=assessment`,
        description: '',
        showButton: true,
      }
    }
    if (swimmer.has_active_po) {
      return {
        title: 'No upcoming lessons',
        buttonText: `Book a lesson for ${swimmer.first_name}`,
        buttonHref: `/parent/book?swimmerId=${swimmer.id}`,
        description: '',
        showButton: true,
      }
    }
    if (swimmer.funding_source && !swimmer.funding_source.requires_authorization) {
      return {
        title: 'No upcoming lessons',
        buttonText: `Book a lesson for ${swimmer.first_name}`,
        buttonHref: `/parent/book?swimmerId=${swimmer.id}`,
        description: '',
        showButton: true,
      }
    }
    if (swimmer.funding_source?.requires_authorization) {
      return {
        title: 'Awaiting Authorization',
        buttonText: '',
        buttonHref: '',
        description: "We'll notify you when lessons are ready to book",
        showButton: false,
      }
    }
    return {
      title: 'No upcoming lessons',
      buttonText: `Book a lesson for ${swimmer.first_name}`,
      buttonHref: `/parent/book?swimmerId=${swimmer.id}`,
      description: '',
      showButton: true,
    }
  }

  // Group bookings by swimmer for empty states
  const bookingsBySwimmer = bookings.reduce((acc, booking) => {
    const swimmerId = booking.swimmer.id
    if (!acc[swimmerId]) {
      acc[swimmerId] = []
    }
    acc[swimmerId].push(booking)
    return acc
  }, {} as Record<string, Booking[]>)

  // Check auth loading states
  const isLoadingAuth = authLoading || isLoadingProfile
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Check if user exists
  if (!user) {
    // This should redirect via middleware, but show a fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the parent dashboard.</p>
        </div>
      </div>
    )
  }

  // Optional: Check if role matches (good practice)
  if (role && role !== 'parent') {
    // This should redirect via dashboard page, but show a fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have access to the parent dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-6 max-w-2xl">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          {/* Upcoming lessons skeleton */}
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          {/* My swimmers skeleton */}
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* STEP 1: Header - Dark navy background */}
      <div className="bg-[#1a3a4f] text-white px-4 py-6 md:p-6">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-300">{today}</p>
              <h1 className="text-2xl font-bold mt-1">Welcome back{firstName ? `, ${firstName}` : ''}!</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" asChild>
                <Link href="/enroll">
                  <Plus className="h-4 w-4 mr-2" />
                  Add swimmer
                </Link>
              </Button>
              <Button size="sm" className="bg-[#23a1c0] hover:bg-[#1d8ba6] text-white" asChild>
                <Link href="/parent/book">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book lesson
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full px-4 py-6 md:px-6 max-w-2xl space-y-8">
        {/* Pending alerts */}
        <PendingEnrollmentAlert />
        <PendingParentReferrals />
        <PendingWaiverAlert />
        <PendingInvitations />

        {/* STEP 2: Upcoming lessons section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Upcoming lessons</h2>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Next 30 days</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/schedule" className="text-[#23a1c0] hover:text-[#1d8ba6]">
                View all
              </Link>
            </Button>
          </div>

          {bookings.length === 0 ? (
            swimmers.length === 0 ? (
              /* No swimmers at all — minimal empty state */
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming lessons</h3>
                <p className="text-gray-500">Add a swimmer first to book lessons</p>
              </div>
            ) : (
              /* Per-swimmer action cards — no generic "No upcoming lessons" */
              <div className="space-y-4">
                {swimmers.map((swimmer) => {
                  const buttonConfig = getSwimmerEmptyAction(swimmer)
                  return (
                    <Card key={swimmer.id} className="border border-dashed border-gray-300">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 bg-[#2a5e84] shrink-0">
                            <AvatarFallback className="bg-[#2a5e84] text-white text-sm">
                              {getSwimmerInitials(swimmer.first_name, swimmer.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">
                              {swimmer.first_name} {swimmer.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">{buttonConfig.title}</p>
                            {buttonConfig.description && (
                              <p className="text-sm text-gray-500 mt-0.5">{buttonConfig.description}</p>
                            )}
                            {buttonConfig.showButton && (
                              <Button
                                size="sm"
                                className="mt-3 bg-[#23a1c0] hover:bg-[#1d8ba6] text-white"
                                asChild
                              >
                                <Link href={buttonConfig.buttonHref}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {buttonConfig.buttonText}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          ) : (
            <>
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const isExtensionPending = booking.status === 'pending_auth' && booking.purchase_order?.is_extension;
                  const isNewFiscalYearPending = booking.status === 'pending_auth' && booking.purchase_order && booking.purchase_order.is_extension === false;

                  // Extension pending card — different visual from confirmed bookings
                  if (isExtensionPending) {
                    const sessionsRemaining = (booking.purchase_order?.sessions_authorized ?? 0) - (booking.purchase_order?.sessions_used ?? 0);
                    return (
                      <Card key={booking.id} className="border border-amber-300 bg-amber-50/40">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 bg-[#2a5e84] shrink-0">
                              <AvatarFallback className="bg-[#2a5e84] text-white">
                                {getSwimmerInitials(booking.swimmer.first_name, booking.swimmer.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">
                                {booking.swimmer.first_name} {booking.swimmer.last_name}
                              </div>
                              <Badge className="mt-1 bg-amber-200 text-amber-900 border-amber-300">
                                Extension Requested
                              </Badge>
                              <p className="text-sm text-amber-800 mt-3 leading-relaxed">
                                An extension has been requested for {booking.swimmer.first_name}&apos;s service authorization ({sessionsRemaining} sessions remaining). Lessons will resume once your coordinator approves.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(booking.session.start_time)}
                                </Badge>
                                <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-200">
                                  {formatTime(booking.session.start_time)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // New fiscal year pending card — Scenario B
                  if (isNewFiscalYearPending) {
                    const sessionsRemaining = (booking.purchase_order?.sessions_authorized ?? 0) - (booking.purchase_order?.sessions_used ?? 0);
                    return (
                      <Card key={booking.id} className="border border-amber-300 bg-amber-50/40">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 bg-[#2a5e84] shrink-0">
                              <AvatarFallback className="bg-[#2a5e84] text-white">
                                {getSwimmerInitials(booking.swimmer.first_name, booking.swimmer.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">
                                {booking.swimmer.first_name} {booking.swimmer.last_name}
                              </div>
                              <Badge className="mt-1 bg-amber-200 text-amber-900 border-amber-300">
                                New Authorization Requested
                              </Badge>
                              <p className="text-sm text-amber-800 mt-3 leading-relaxed">
                                A new authorization has been requested for {booking.swimmer.first_name} for the new fiscal year ({sessionsRemaining} sessions). Lessons will resume once your coordinator approves.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(booking.session.start_time)}
                                </Badge>
                                <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-200">
                                  {formatTime(booking.session.start_time)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Confirmed (or other) booking — standard card
                  const canCancel = canCancelBooking(booking.session.start_time)
                  const isCanceling = cancelingBookingId === booking.id
                  const showConfirm = showCancelConfirm === booking.id
                  const showLateMessage = showLateCancelMessage === booking.id

                  return (
                    <Card key={booking.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        {/* Lesson card header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10 bg-[#2a5e84] shrink-0">
                              <AvatarFallback className="bg-[#2a5e84] text-white">
                                {getSwimmerInitials(booking.swimmer.first_name, booking.swimmer.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {booking.swimmer.first_name} {booking.swimmer.last_name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{booking.session.instructor?.full_name || 'Instructor TBD'}</span>
                                <span className="mx-1 shrink-0">•</span>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{booking.session.location}</span>
                              </div>
                            </div>
                          </div>
                          {getSessionTypeBadge(booking.session.session_type)}
                        </div>

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="bg-gray-50">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(booking.session.start_time)}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50">
                            {formatTime(booking.session.start_time)}
                          </Badge>
                        </div>

                        {/* Cancel button or confirmation */}
                        {showLateMessage ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-red-800 mb-1">Cannot cancel online</h4>
                                <p className="text-sm text-red-700 mb-3">
                                  This lesson is within 24 hours and cannot be cancelled online.
                                  Cancellations within 24 hours may result in being removed from the program.
                                </p>
                                <div className="space-y-2">
                                  <a
                                    href="sms:2096437969"
                                    className="flex items-center justify-center w-full px-4 py-2 text-sm border border-red-300 text-red-700 hover:bg-red-100 rounded-md transition-colors"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Text 209-643-7969
                                  </a>
                                  <a
                                    href="tel:2097787877"
                                    className="flex items-center justify-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call (209) 778-7877
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full text-gray-600 hover:bg-gray-100"
                                    onClick={() => setShowLateCancelMessage(null)}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : showConfirm ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 mb-2">Cancel this lesson?</h4>
                            <p className="text-sm text-yellow-700 mb-3">
                              Are you sure you want to cancel this lesson?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-gray-300"
                                onClick={() => setShowCancelConfirm(null)}
                                disabled={isCanceling}
                              >
                                Keep lesson
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={isCanceling}
                              >
                                {isCanceling ? 'Cancelling...' : 'Yes, cancel'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setShowCancelConfirm(booking.id)}
                            disabled={isCanceling}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel lesson
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Per-swimmer empty states for swimmers without bookings */}
              {swimmers.filter(s => !bookingsBySwimmer[s.id]?.length).map((swimmer) => {
                const buttonConfig = getSwimmerEmptyAction(swimmer)
                return (
                  <Card key={swimmer.id} className="border border-dashed border-gray-300 mt-4">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 bg-[#2a5e84] shrink-0">
                          <AvatarFallback className="bg-[#2a5e84] text-white text-sm">
                            {getSwimmerInitials(swimmer.first_name, swimmer.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{swimmer.first_name} {swimmer.last_name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{buttonConfig.title}</p>
                          {buttonConfig.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{buttonConfig.description}</p>
                          )}
                          {buttonConfig.showButton && (
                            <Button
                              size="sm"
                              className="mt-3 bg-[#23a1c0] hover:bg-[#1d8ba6] text-white"
                              asChild
                            >
                              <Link href={buttonConfig.buttonHref}>
                                <Calendar className="h-4 w-4 mr-2" />
                                {buttonConfig.buttonText}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>

        {/* STEP 4: My swimmers section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">My swimmers</h2>
              <p className="text-sm text-gray-500 uppercase tracking-wide">All enrolled swimmers</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/swimmers" className="text-[#23a1c0] hover:text-[#1d8ba6]">
                View all
              </Link>
            </Button>
          </div>

          {swimmers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No swimmers yet</h3>
              <p className="text-gray-500 mb-4">Add your first swimmer to get started with lessons</p>
              <Button className="bg-[#23a1c0] hover:bg-[#1d8ba6] text-white" asChild>
                <Link href="/enroll">
                  <Plus className="h-4 w-4 mr-2" />
                  Add swimmer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {swimmers.map((swimmer) => (
                <Link
                  key={swimmer.id}
                  href={`/parent/swimmers/${swimmer.id}`}
                  className="block"
                >
                  <Card className="border border-gray-200 hover:border-[#23a1c0] transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 bg-[#2a5e84]">
                            <AvatarFallback className="bg-[#2a5e84] text-white">
                              {getSwimmerInitials(swimmer.first_name, swimmer.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {swimmer.first_name} {swimmer.last_name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {swimmer.current_level && (
                                <Badge
                                  variant="outline"
                                  className={`${getLevelColor(swimmer.current_level.name)} text-xs`}
                                >
                                  {swimmer.current_level.display_name}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`${getEnrollmentStatusBadge(swimmer.enrollment_status)} text-xs`}
                              >
                                {getEnrollmentStatusDisplay(swimmer.enrollment_status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}