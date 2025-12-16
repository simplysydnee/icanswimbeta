'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SwimmerCard } from '@/components/parent/swimmer-card'
import { UpcomingSessions } from '@/components/parent/upcoming-sessions'
import { PendingEnrollmentAlert } from '@/components/dashboard/PendingEnrollmentAlert'
import Link from 'next/link'
import { Plus, Calendar, Users } from 'lucide-react'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  enrollment_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
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

export default function ParentDashboard() {
  const { user, profile } = useAuth()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch parent's swimmers
        const { data: swimmersData, error: swimmersError } = await supabase
          .from('swimmers')
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            enrollment_status,
            current_level:swim_levels(name, display_name, color)
          `)
          .eq('parent_id', user.id)
          .order('first_name')

        if (swimmersError) {
          console.error('Error fetching swimmers:', swimmersError)
          // Continue with empty swimmers array
        } else {
          setSwimmers(swimmersData || [])
        }

        // Fetch upcoming bookings
        try {
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
            .eq('parent_id', user.id)
            .eq('status', 'confirmed')
            .gte('sessions.start_time', new Date().toISOString())
            .order('sessions.start_time', { ascending: true })
            .limit(5)

          if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError)
            // Continue with empty bookings array
          } else {
            setBookings(bookingsData || [])
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
    }

    fetchData()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const enrolledSwimmers = swimmers.filter(s => s.enrollment_status === 'enrolled')
  const upcomingBookings = bookings.filter(b => new Date(b.session.start_time) > new Date())

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || 'Parent'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your swimmers and upcoming lessons
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/enroll/private">
              <Plus className="h-4 w-4 mr-2" />
              Add Swimmer
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/parent/book">
              <Calendar className="h-4 w-4 mr-2" />
              Book Lesson
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending enrollment alert */}
      <PendingEnrollmentAlert />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swimmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swimmers.length}</div>
            <p className="text-xs text-muted-foreground">
              {enrolledSwimmers.length} currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Level</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🏊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.length > 0 ? 'Multiple' : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all swimmers
            </p>
          </CardContent>
        </Card>

        <Link href="/parent/sessions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View All</div>
              <p className="text-xs text-muted-foreground">
                Cancel or reschedule
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Swimmers */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">My Swimmers</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/parent/swimmers">
                View All
              </Link>
            </Button>
          </div>

          {swimmers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No swimmers yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first swimmer to get started with lessons
                  </p>
                  <Button asChild>
                    <Link href="/enroll/private">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Swimmer
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {swimmers.slice(0, 3).map((swimmer) => (
                <SwimmerCard key={swimmer.id} swimmer={swimmer} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div>
          <UpcomingSessions bookings={upcomingBookings} />
        </div>
      </div>
    </div>
  )
}