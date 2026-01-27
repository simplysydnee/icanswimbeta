'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStaffMode } from './StaffModeContext'
import { useToast } from '@/hooks/use-toast'
import IcanSwimLogo from '@/components/IcanSwimLogo'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Users } from 'lucide-react'

interface InstructorWithSessions {
  id: string
  name: string
  avatarUrl: string | null
  email: string
  sessionCount: number
}

async function fetchInstructorsWithTodaySessions(): Promise<InstructorWithSessions[]> {
  const supabase = createClient()

  try {
    // Get today's date in local timezone (YYYY-MM-DD format)
    const today = new Date().toLocaleDateString('en-CA') // Returns YYYY-MM-DD in local timezone

    // First, fetch all active instructors
    // For staff mode, we show all active instructors, not just those with display_on_team = true
    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('is_active', true)
      .order('full_name')

    if (instructorsError) {
      console.error('Error fetching instructors:', instructorsError)
      throw new Error('Failed to fetch instructors')
    }

    if (!instructors || instructors.length === 0) {
      console.log('=== DEBUG: No active instructors found')
      return []
    }

    // Get instructor IDs
    const instructorIds = instructors.map(instructor => instructor.id)

    // Query sessions with bookings and status filter
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        instructor_id,
        bookings!inner (
          id
        )
      `)
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)
      .in('instructor_id', instructorIds)
      .in('status', ['booked', 'open', 'available']) // Sessions that are booked or available

    if (sessionsError) {
      console.error('Error fetching today\'s sessions:', sessionsError)
      throw new Error('Failed to fetch today\'s sessions')
    }

    console.log('=== DEBUG: Sessions query result ===')
    console.log('Number of sessions found:', sessions?.length || 0)
    console.log('Sessions data:', sessions)

    // Count sessions per instructor
    const sessionCounts: Record<string, number> = {}
    sessions?.forEach(session => {
      if (session.instructor_id) {
        sessionCounts[session.instructor_id] = (sessionCounts[session.instructor_id] || 0) + 1
      }
    })

    // Combine instructor data with session counts
    const instructorsWithSessions = instructors.map(instructor => ({
      id: instructor.id,
      name: instructor.full_name || 'Unknown Instructor',
      avatarUrl: instructor.avatar_url,
      email: instructor.email,
      sessionCount: sessionCounts[instructor.id] || 0
    }))

    // Show all active instructors, not just those with sessions
    return instructorsWithSessions

  } catch (error) {
    console.error('Error in fetchInstructorsWithTodaySessions:', error)
    throw error
  }
}

export default function StaffInstructorSelect() {
  const router = useRouter()
  const { setSelectedInstructor } = useStaffMode()
  const { toast } = useToast()
  const [isSelecting, setIsSelecting] = useState(false)

  const { data: instructors, isLoading, error } = useQuery({
    queryKey: ['staffInstructorsWithSessions'],
    queryFn: fetchInstructorsWithTodaySessions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleInstructorSelect = async (instructor: InstructorWithSessions) => {
    try {
      setIsSelecting(true)

      // Set the selected instructor in context
      setSelectedInstructor({
        id: instructor.id,
        name: instructor.name,
        avatarUrl: instructor.avatarUrl || undefined
      })

      toast({
        title: 'Instructor selected',
        description: `Welcome, ${instructor.name}!`,
      })
    } catch (err) {
      console.error('Error selecting instructor:', err)
      toast({
        title: 'Error',
        description: 'Failed to select instructor. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSelecting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSessionText = (count: number) => {
    if (count === 0) return 'No sessions scheduled'
    if (count === 1) return '1 swimmer today'
    return `${count} swimmers today`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="mb-12 text-center">
            <IcanSwimLogo />
            <h2 className="mt-8 text-3xl font-bold text-[#2a5e84]">Select Instructor</h2>
            <p className="mt-2 text-gray-600">Loading instructors with today's sessions...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#6abedc]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="mb-12 text-center">
            <IcanSwimLogo />
            <h2 className="mt-8 text-3xl font-bold text-[#2a5e84]">Select Instructor</h2>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 font-medium">Error loading instructors</p>
                <p className="text-red-500 text-sm mt-2">
                  {error instanceof Error ? error.message : 'Failed to fetch instructors'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header with logo */}
        <div className="mb-12 text-center">
          <IcanSwimLogo />
          <h2 className="mt-8 text-3xl font-bold text-[#2a5e84]">Select Instructor</h2>
          <p className="mt-2 text-gray-600">Choose your profile to access today's schedule</p>
        </div>

        {/* Instructor grid */}
        {instructors && instructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instructors.map((instructor) => (
              <Card
                key={instructor.id}
                className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-[#6abedc]/30 hover:border-[#2a5e84] min-h-[180px] flex flex-col"
                onClick={() => !isSelecting && handleInstructorSelect(instructor)}
              >
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 border-2 border-[#6abedc]">
                      {instructor.avatarUrl ? (
                        <AvatarImage
                          src={instructor.avatarUrl}
                          alt={instructor.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-[#2a5e84] text-white text-lg font-semibold">
                        {getInitials(instructor.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Instructor info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{instructor.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{instructor.email}</p>

                      {/* Session count */}
                      <div className="mt-4 flex items-center text-[#2a5e84]">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-semibold">{getSessionText(instructor.sessionCount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Select button */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      className="w-full bg-[#2a5e84] hover:bg-[#1e4565] text-white"
                      disabled={isSelecting}
                      onClick={() => handleInstructorSelect(instructor)}
                    >
                      {isSelecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        'Select Instructor'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No active instructors found</h3>
                <p className="text-gray-500 mt-2">
                  There are no active instructors. Please contact an administrator.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer note */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Staff Mode • I Can Swim Beta</p>
          <p className="mt-1">Select your instructor profile to access today's schedule and swimmer management tools.</p>
        </div>
      </div>
    </div>
  )
}