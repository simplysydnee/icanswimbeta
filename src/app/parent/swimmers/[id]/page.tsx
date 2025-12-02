'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LevelBadge } from '@/components/parent/level-badge'
import { UpcomingSessions } from '@/components/parent/upcoming-sessions'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit, Users } from 'lucide-react'

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
  // VMRC info
  payment_type: string
  is_vmrc_client: boolean
  vmrc_coordinator_name?: string
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
        // Fetch swimmer details
        const { data: swimmerData, error: swimmerError } = await supabase
          .from('swimmers')
          .select(`
            *,
            current_level:swim_levels(name, display_name, color)
          `)
          .eq('id', swimmerId)
          .eq('parent_id', user.id)
          .single()

        if (swimmerError) throw swimmerError

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
          .gte('sessions.start_time', new Date().toISOString())
          .order('sessions.start_time', { ascending: true })

        if (bookingsError) throw bookingsError

        setSwimmer(swimmerData)
        setBookings(bookingsData || [])
      } catch (error) {
        console.error('Error fetching swimmer data:', error)
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
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Type
                  </label>
                  <p className="text-sm capitalize">
                    {swimmer.payment_type?.replace('_', ' ') || 'Private Pay'}
                  </p>
                </div>
                {swimmer.is_vmrc_client && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      VMRC Coordinator
                    </label>
                    <p className="text-sm">
                      {swimmer.vmrc_coordinator_name || 'Not specified'}
                    </p>
                  </div>
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
              <Button variant="outline" className="w-full">
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}