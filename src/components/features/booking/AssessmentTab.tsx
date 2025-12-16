'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { emailService } from '@/lib/email-service'
import { InstructorAvatar } from '@/components/ui/instructor-avatar'

interface Session {
  id: string
  start_time: string
  end_time: string
  location: string
  status: string
  is_full: boolean
  booking_count: number
  max_capacity: number
  instructor?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  funding_source_id: string | null
  assessment_status: string | null
  parent_id: string
}

interface AssessmentTabProps {
  selectedSwimmerId?: string
  onBookingComplete?: () => void
}

export function AssessmentTab({ selectedSwimmerId, onBookingComplete }: AssessmentTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [sessions, setSessions] = useState<Session[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [fundingSources, setFundingSources] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [selectedSwimmer, setSelectedSwimmer] = useState<string | null>(selectedSwimmerId || null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  // Fetch available assessment sessions
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          end_time,
          location,
          status,
          is_full,
          booking_count,
          max_capacity,
          instructor:profiles!instructor_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('session_type', 'assessment')
        .in('status', ['available', 'open'])
        .eq('is_full', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching sessions:', error)
        toast({
          title: 'Error',
          description: 'Failed to load available sessions',
          variant: 'destructive',
        })
      } else {
        setSessions(data || [])
      }
    }

    fetchSessions()
  }, [supabase, toast])

  // Fetch parent's swimmers who need assessment
  useEffect(() => {
    const fetchSwimmers = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('swimmers')
        .select('id, first_name, last_name, funding_source_id, assessment_status, parent_id')
        .eq('parent_id', user.id)
        .in('assessment_status', ['not_scheduled', 'needs_assessment', null])
        .eq('approval_status', 'approved')

      if (error) {
        console.error('Error fetching swimmers:', error)
      } else {
        setSwimmers(data || [])
      }
      setLoading(false)
    }

    fetchSwimmers()
  }, [user, supabase])

  // Update selectedSwimmer when prop changes
  useEffect(() => {
    if (selectedSwimmerId) {
      setSelectedSwimmer(selectedSwimmerId)
    }
  }, [selectedSwimmerId])

  // Fetch funding sources
  useEffect(() => {
    const fetchFundingSources = async () => {
      const { data, error } = await supabase
        .from('funding_sources')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching funding sources:', error)
      } else {
        setFundingSources(data || [])
      }
    }

    fetchFundingSources()
  }, [supabase])

  // Helper function to check if a swimmer is a regional center client
  const isRegionalCenterClient = (fundingSourceId: string | null): boolean => {
    if (!fundingSourceId) return false
    const fundingSource = fundingSources.find(fs => fs.id === fundingSourceId)
    return fundingSource?.type === 'regional_center'
  }

  // Get selected swimmer data
  const selectedSwimmerData = swimmers.find(s => s.id === selectedSwimmer)

  const handleConfirm = async () => {
    if (!selectedSession || !selectedSwimmer) {
      toast({
        title: 'Selection Required',
        description: 'Please select both a swimmer and a session.',
        variant: 'destructive',
      })
      return
    }

    setConfirming(true)

    try {
      // Call the API to create booking
      const response = await fetch('/api/bookings/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          swimmerId: selectedSwimmer,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book assessment')
      }

      // Send confirmation email
      if (result.emailData) {
        const emailResult = await emailService.sendAssessmentBooking({
          parentEmail: result.emailData.parentEmail,
          parentName: result.emailData.parentName,
          childName: result.emailData.childName,
          date: format(new Date(result.emailData.date), 'EEEE, MMMM d, yyyy'),
          time: format(new Date(result.emailData.time), 'h:mm a'),
          location: result.emailData.location,
          instructor: result.emailData.instructor,
        })

        if (!emailResult.success) {
          console.warn('Confirmation email may be delayed')
        }
      }

      // Show success
      toast({
        title: 'Assessment Booked! 🎉',
        description: `Your assessment has been scheduled. Check your email for confirmation.`,
      })

      // Update local state to remove booked swimmer
      setSwimmers(prev => prev.filter(s => s.id !== selectedSwimmer))

      // Update local sessions to reflect booking
      setSessions(prev => prev.map(s => {
        if (s.id === selectedSession) {
          const newCount = (s.booking_count || 0) + 1
          return {
            ...s,
            booking_count: newCount,
            is_full: newCount >= (s.max_capacity || 1),
          }
        }
        return s
      }).filter(s => !s.is_full))

      // Reset selections
      setSelectedSession(null)
      setSelectedSwimmer(null)

      // Call the completion callback
      onBookingComplete?.()

    } catch (error) {
      console.error('Booking error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unable to book assessment. Please try again.'
      toast({
        title: 'Booking Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  const selectedSessionData = sessions.find(s => s.id === selectedSession)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
      </div>
    )
  }

  // No swimmers need assessment
  if (swimmers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">All Set!</h3>
          <p className="text-gray-600 mt-2">
            All your swimmers have assessments scheduled or completed.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No available sessions
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Available Sessions</h3>
          <p className="text-gray-600 mt-2">
            There are no assessment slots available at this time.
            Please check back later or contact us.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            📞 (209) 778-7877 | ✉️ info@icanswim209.com
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Book an Assessment</h2>
        <p className="text-gray-600 mt-1">
          Schedule a 45-minute swim assessment for your child.
          {selectedSwimmerData && isRegionalCenterClient(selectedSwimmerData.funding_source_id) && (
            <span className="text-green-600 font-medium"> (Regional Center - No charge)</span>
          )}
        </p>
      </div>

      {/* Step 1: Select Swimmer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2a5e84] text-white text-sm">1</span>
            Select Swimmer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSwimmer || ''} onValueChange={setSelectedSwimmer}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a swimmer..." />
            </SelectTrigger>
            <SelectContent>
              {swimmers.map((swimmer) => (
                <SelectItem key={swimmer.id} value={swimmer.id}>
                  <div className="flex items-center gap-2">
                    {swimmer.first_name} {swimmer.last_name}
                    {isRegionalCenterClient(swimmer.funding_source_id) && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Regional Center</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Select Session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2a5e84] text-white text-sm">2</span>
            Select Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedSession === session.id
                    ? 'border-[#2a5e84] bg-[#2a5e84]/5 ring-2 ring-[#2a5e84]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Instructor Avatar */}
                    <InstructorAvatar
                      name={session.instructor?.full_name || 'TBD'}
                      avatarUrl={session.instructor?.avatar_url}
                      size="md"
                    />

                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-[#2a5e84]" />
                        {format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.start_time), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {session.instructor?.full_name || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSession === session.id && (
                    <CheckCircle className="h-5 w-5 text-[#2a5e84]" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {sessions.length > 10 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing first 10 available slots. More times available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Summary */}
      {selectedSession && selectedSwimmer && (
        <Card className="border-[#2a5e84]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2a5e84] text-white text-sm">3</span>
              Confirm Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Swimmer:</span>
                <span className="font-medium">
                  {selectedSwimmerData?.first_name} {selectedSwimmerData?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {selectedSessionData && format(new Date(selectedSessionData.start_time), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {selectedSessionData && format(new Date(selectedSessionData.start_time), 'h:mm a')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{selectedSessionData?.location || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instructor:</span>
                <span className="font-medium">{selectedSessionData?.instructor?.full_name || 'TBD'}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Price:</span>
                <span className="font-bold text-lg">
                  {selectedSwimmerData && isRegionalCenterClient(selectedSwimmerData.funding_source_id) ? (
                    <span className="text-green-600">$0 (Regional Center)</span>
                  ) : (
                    '$65'
                  )}
                </span>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full mt-4 bg-[#2a5e84] hover:bg-[#1e4a6d]"
              size="lg"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Assessment Booking'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By confirming, you agree to our 24-hour cancellation policy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}