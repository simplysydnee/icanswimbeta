'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LevelBadge } from '@/components/parent/level-badge'
import { LessonCountBadge } from '@/components/parent/lesson-count-badge'
import { UpcomingSessions } from '@/components/parent/upcoming-sessions'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit, Users, Award, FileText, Activity } from 'lucide-react'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  photo_url?: string
  enrollment_status: string
  assessment_status: string
  approval_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
  // Medical info
  has_allergies: boolean
  allergies_description?: string
  has_medical_conditions: boolean
  medical_conditions_description?: string
  diagnosis?: string[]
  // Swimming background
  previous_swim_lessons: boolean
  comfortable_in_water: string
  swim_goals?: string[]
  // Funding source info
  payment_type: string
  funding_source_id?: string
  funding_source_name?: string
  funding_source_short_name?: string
  funding_coordinator_name?: string
  funding_coordinator_email?: string
  funding_coordinator_phone?: string
  sessions_used?: number
  sessions_authorized?: number
  // Progress tracking
  lessons_completed?: number
}

interface Booking {
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
}


export default function SwimmerDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const swimmerId = params.id as string

  useEffect(() => {
    const fetchSwimmerData = async () => {
      if (!user || !swimmerId) return

      try {
        // Fetch swimmer details - use .maybeSingle() instead of .single() to handle no results
        const { data: swimmerData, error: swimmerError } = await supabase
          .from('swimmers')
          .select(`
            *,
            current_level:swim_levels(name, display_name, color),
          `)
          .eq('id', swimmerId)
          .eq('parent_id', user.id)
          .maybeSingle() // Use maybeSingle instead of single to handle no results

        if (swimmerError) {
          console.error('Swimmer query error:', swimmerError)
          throw swimmerError
        }

        if (!swimmerData) {
          console.error('No swimmer found with ID:', swimmerId, 'for user:', user.id)
          router.push('/parent/swimmers')
          return
        }

        // Fetch swimmer's upcoming bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            session:sessions(
              id,
              start_time,
              end_time,
              location,
              instructor:profiles(full_name)
            ),
            swimmer:swimmers(first_name, last_name)
          `)
          .eq('swimmer_id', swimmerId)
          .eq('status', 'confirmed')
          .gte('session.start_time', new Date().toISOString())
          // .order('session.start_time', { ascending: true }) // Temporarily removed to test

        if (bookingsError) {
          console.error('Bookings query error:', bookingsError)
          throw bookingsError
        }

        // Fetch completed bookings count
        const { count: completedCount, error: countError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('swimmer_id', swimmerId)
          .eq('status', 'completed')

        if (countError) {
          console.error('Error fetching completed bookings count:', countError)
          // Continue with 0 count
        }

        // Transform swimmer data
        const transformedSwimmer = {
          ...swimmerData,
          lessons_completed: completedCount || 0
        }

        // Transform bookings data to match the Booking interface
        const transformedBookings: Booking[] = (bookingsData || []).map((rawBooking) => ({
          id: rawBooking.id,
          session: {
            id: rawBooking.session[0]?.id || '',
            start_time: rawBooking.session[0]?.start_time || '',
            end_time: rawBooking.session[0]?.end_time || '',
            location: rawBooking.session[0]?.location || '',
            instructor: rawBooking.session[0]?.instructor?.[0] ? {
              full_name: rawBooking.session[0]?.instructor[0]?.full_name
            } : undefined
          },
          swimmer: {
            first_name: rawBooking.swimmer[0]?.first_name || '',
            last_name: rawBooking.swimmer[0]?.last_name || ''
          }
        }))

        // Sort bookings by session start time (since we can't use .order() with joined tables)
        transformedBookings.sort((a, b) =>
          new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
        )

        setSwimmer(transformedSwimmer)
        setBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching swimmer data:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Swimmer ID:', swimmerId)
        console.error('User ID:', user?.id)
        router.push('/parent/swimmers')
      } finally {
        setLoading(false)
      }
    }

    fetchSwimmerData()
  }, [user, swimmerId, supabase, router])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!swimmer) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Swimmer not found</h3>
              <p className="text-muted-foreground mb-4">
                The swimmer you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
              </p>
              <Button asChild>
                <Link href="/parent/swimmers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Swimmers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/swimmers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {swimmer.first_name} {swimmer.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={getStatusColor(swimmer.enrollment_status)}
              >
                {getStatusDisplay(swimmer.enrollment_status)}
              </Badge>
              {swimmer.current_level && (
                <LevelBadge level={swimmer.current_level} />
              )}
              {swimmer.funding_source_short_name && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  {swimmer.funding_source_short_name} Client
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/booking?swimmer=${swimmer.id}`}>
              <Calendar className="h-4 w-4 mr-2" />
              Book Lesson
            </Link>
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      {swimmer.lessons_completed !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Swim Progress</h3>
                  <p className="text-muted-foreground">
                    Track {swimmer.first_name}'s swimming journey
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {swimmer.lessons_completed}
                </div>
                <div className="text-sm text-muted-foreground">
                  lessons completed
                </div>
              </div>
              <div>
                <LessonCountBadge count={swimmer.lessons_completed} size="lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date of Birth
                  </label>
                  <p className="text-sm">
                    {swimmer.date_of_birth ? (
                      `${new Date(swimmer.date_of_birth).toLocaleDateString()} (${calculateAge(swimmer.date_of_birth)} years old)`
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </label>
                  <p className="text-sm capitalize">
                    {swimmer.gender || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical & Safety Information */}
          <Card>
            <CardHeader>
              <CardTitle>Medical & Safety Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Allergies
                  </label>
                  <p className="text-sm">
                    {swimmer.has_allergies ? (
                      swimmer.allergies_description || 'Yes'
                    ) : (
                      'None reported'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Medical Conditions
                  </label>
                  <p className="text-sm">
                    {swimmer.has_medical_conditions ? (
                      swimmer.medical_conditions_description || 'Yes'
                    ) : (
                      'None reported'
                    )}
                  </p>
                </div>
              </div>
              {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Diagnosis
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {swimmer.diagnosis.map((diagnosis, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {diagnosis}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Swimming Background */}
          <Card>
            <CardHeader>
              <CardTitle>Swimming Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Previous Swim Lessons
                  </label>
                  <p className="text-sm">
                    {swimmer.previous_swim_lessons ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Comfort in Water
                  </label>
                  <p className="text-sm capitalize">
                    {swimmer.comfortable_in_water || 'Not specified'}
                  </p>
                </div>
              </div>
              {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Swim Goals
                  </label>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {swimmer.swim_goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Type
                  </label>
                  <p className="text-sm capitalize">
                    {swimmer.payment_type?.replace('_', ' ') || 'Private Pay'}
                  </p>
                </div>
                {swimmer.funding_source_id && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {swimmer.funding_source_name || 'Funding Source'} Coordinator
                      </label>
                      <p className="text-sm">
                        {swimmer.funding_coordinator_name || 'Not specified'}
                      </p>
                    </div>
                    {swimmer.sessions_authorized !== undefined && swimmer.sessions_used !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {swimmer.funding_source_name || 'Funding Source'} Session Usage
                        </label>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Sessions used</span>
                            <span className="font-medium">
                              {swimmer.sessions_used} / {swimmer.sessions_authorized}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, (swimmer.sessions_used / swimmer.sessions_authorized) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {swimmer.sessions_authorized - swimmer.sessions_used} sessions remaining
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UpcomingSessions bookings={bookings} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/booking?swimmer=${swimmer.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Lesson
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/parent/swimmers/${swimmer.id}/progress`}>
                  <Activity className="h-4 w-4 mr-2" />
                  View Progress
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Notes
              </Button>
              {swimmer.funding_source_id && swimmer.sessions_authorized && swimmer.sessions_used && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">{swimmer.funding_source_name || 'Funding Source'} Status</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sessions remaining:</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {swimmer.sessions_authorized - swimmer.sessions_used}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}