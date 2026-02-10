'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStaffMode } from './StaffModeContext'
import { format, addDays } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Loader2, ArrowLeft, Search, Calendar, Users, LogOut, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionWithSwimmer {
  id: string
  start_time: string
  swimmer_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  photo_url: string | null
  current_level_id: string
  level_name: string
  level_sequence: number
  assessment_status: string | null
  mastered_skills_count: number
  total_skills_count: number
  strategies: string[]
  // Important medical/safety information
  has_allergies: boolean
  allergies_description: string | null
  has_medical_conditions: boolean
  medical_conditions_description: string | null
  history_of_seizures: boolean
  seizures_description: string | null
  important_notes: string[]
  // Parent contact information
  parent_phone: string | null
  parent_email: string | null
}

async function fetchTodaySessions(instructorId: string): Promise<SessionWithSwimmer[]> {
  const supabase = createClient()

  try {
    // Get today's date with proper timezone adjustment
    // Sessions are stored in UTC but represent local time with 8-hour offset
    const today = new Date()
    const dateStr = format(today, 'yyyy-MM-dd')
    const startOfDayUTC = `${dateStr}T08:00:00.000Z`
    const endOfDayUTC = `${format(addDays(today, 1), 'yyyy-MM-dd')}T08:00:00.000Z`

    console.log('=== DEBUG: Fetching sessions for instructor ===')
    console.log('Instructor ID:', instructorId)
    console.log('Date range (UTC) - startOfDayUTC:', startOfDayUTC)
    console.log('Date range (UTC) - endOfDayUTC:', endOfDayUTC)
    console.log('Today date string:', dateStr)
    console.log('Local date:', today.toLocaleDateString())
    console.log('Local time now:', new Date().toLocaleTimeString())
    console.log('Current UTC time:', new Date().toISOString())

    // First, let's debug by fetching ALL sessions for this instructor
    // without date filter to see what we get
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        status,
        bookings!inner (
          swimmer_id
        )
      `)
      .eq('instructor_id', instructorId)
      .order('start_time')

    if (allSessionsError) {
      console.error('Error fetching all sessions:', allSessionsError)
      throw new Error('Failed to fetch sessions')
    }

    console.log('=== DEBUG: ALL sessions for instructor ===')
    console.log('Total sessions:', allSessions?.length || 0)
    if (allSessions && allSessions.length > 0) {
      // Show first 10 sessions for debugging
      console.log('First 10 session dates:', allSessions.slice(0, 10).map(s => ({
        id: s.id,
        start_time: s.start_time,
        start_time_iso: new Date(s.start_time).toISOString(),
        start_time_pst: new Date(s.start_time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        status: s.status,
        has_booking: !!s.bookings?.[0]?.swimmer_id
      })))
    }

    console.log('🔍 UTC date range for filtering:')
    console.log('startOfDayUTC:', startOfDayUTC)
    console.log('endOfDayUTC:', endOfDayUTC)
    console.log('Local date for reference:', dateStr)
    console.log('🔍 PST date range equivalent:')
    console.log('Start of day PST:', new Date(startOfDayUTC).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
    console.log('End of day PST:', new Date(endOfDayUTC).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))

    // Now filter for today's sessions using UTC range (sessions are stored in UTC with 8-hour offset)
    const sessions = allSessions?.filter(session => {
      const sessionTime = session.start_time
      const isToday = sessionTime >= startOfDayUTC && sessionTime < endOfDayUTC

      if (!isToday) {
        console.log('❌ Session filtered out:', {
          start_time: session.start_time,
          sessionTime_UTC: sessionTime,
          startOfDayUTC,
          endOfDayUTC,
          sessionDate: new Date(sessionTime).toISOString(),
          sessionLocal: new Date(sessionTime).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
        })
      }

      return isToday
    }) || []

    console.log('=== DEBUG: Filtered to today (NEW CODE v2) ===')
    console.log('Today\'s sessions:', sessions.length)
    console.log('Session times (UTC):', sessions.map(s => s.start_time))
    console.log('Session times (PST):', sessions.map(s =>
      new Date(s.start_time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    ))


    console.log('=== DEBUG: Sessions found ===')
    console.log('Number of sessions:', sessions?.length || 0)
    if (sessions && sessions.length > 0) {
      console.log('Session times (UTC):', sessions.map(s => s.start_time))
      console.log('Session times (PST):', sessions.map(s => new Date(s.start_time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })))
    } else {
      console.log('No sessions found for this date range')
    }

    if (!sessions || sessions.length === 0) {
      return []
    }

    // Get swimmer IDs from bookings
    const swimmerIds = sessions
      .map(session => session.bookings?.[0]?.swimmer_id)
      .filter(Boolean) as string[]

    if (swimmerIds.length === 0) {
      return []
    }

    // Fetch swimmers with their level information and parent contact
    const { data: swimmers, error: swimmersError } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        photo_url,
        current_level_id,
        assessment_status,
        has_allergies,
        allergies_description,
        has_medical_conditions,
        medical_conditions_description,
        history_of_seizures,
        seizures_description,
        important_notes,
        parent_id,
        parent_email,
        profiles!swimmers_parent_id_fkey (
          phone,
          email
        ),
        swim_levels (
          name,
          sequence
        )
      `)
      .in('id', swimmerIds)

    if (swimmersError) {
      console.error('Error fetching swimmers:', swimmersError)
      throw new Error('Failed to fetch swimmers')
    }

    // Create a map of swimmer data for easy lookup
    const swimmerMap = new Map(
      swimmers.map(swimmer => [
        swimmer.id,
        {
          ...swimmer,
          level_name: swimmer.swim_levels?.name || 'No Level',
          level_sequence: swimmer.swim_levels?.sequence || 0,
          parent_phone: swimmer.profiles?.[0]?.phone || null,
          parent_email: swimmer.parent_email || swimmer.profiles?.[0]?.email || null
        }
      ])
    )

    // Fetch skills for all swimmers
    const { data: skills, error: skillsError } = await supabase
      .from('swimmer_skills')
      .select('swimmer_id, status')
      .in('swimmer_id', swimmerIds)

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      throw new Error('Failed to fetch swimmer skills')
    }

    // Count mastered skills per swimmer
    const skillCounts = new Map<string, { mastered: number; total: number }>()
    skills?.forEach(skill => {
      const current = skillCounts.get(skill.swimmer_id) || { mastered: 0, total: 0 }
      skillCounts.set(skill.swimmer_id, {
        mastered: current.mastered + (skill.status === 'mastered' ? 1 : 0),
        total: current.total + 1
      })
    })

    // Fetch strategies for all swimmers
    const { data: strategies, error: strategiesError } = await supabase
      .from('swimmer_strategies')
      .select('swimmer_id, strategy_name')
      .in('swimmer_id', swimmerIds)
      .eq('is_used', true)
      .order('created_at', { ascending: false })

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      throw new Error('Failed to fetch swimmer strategies')
    }

    // Group strategies by swimmer
    const strategyMap = new Map<string, string[]>()
    strategies?.forEach(strategy => {
      const current = strategyMap.get(strategy.swimmer_id) || []
      if (current.length < 3) { // Limit to 3 strategies
        current.push(strategy.strategy_name)
      }
      strategyMap.set(strategy.swimmer_id, current)
    })

    // Combine all data
    const sessionsWithSwimmers: SessionWithSwimmer[] = sessions
      .map(session => {
        const swimmerId = session.bookings?.[0]?.swimmer_id
        if (!swimmerId) return null

        const swimmer = swimmerMap.get(swimmerId)
        if (!swimmer) return null

        const skillCount = skillCounts.get(swimmerId) || { mastered: 0, total: 0 }
        const swimmerStrategies = strategyMap.get(swimmerId) || []

        return {
          id: session.id,
          start_time: session.start_time,
          swimmer_id: swimmerId,
          first_name: swimmer.first_name,
          last_name: swimmer.last_name,
          date_of_birth: swimmer.date_of_birth,
          photo_url: swimmer.photo_url,
          current_level_id: swimmer.current_level_id,
          level_name: swimmer.level_name,
          level_sequence: swimmer.level_sequence,
          assessment_status: swimmer.assessment_status,
          mastered_skills_count: skillCount.mastered,
          total_skills_count: skillCount.total,
          strategies: swimmerStrategies,
          // Important medical/safety information
          has_allergies: swimmer.has_allergies || false,
          allergies_description: swimmer.allergies_description,
          has_medical_conditions: swimmer.has_medical_conditions || false,
          medical_conditions_description: swimmer.medical_conditions_description,
          history_of_seizures: swimmer.history_of_seizures || false,
          seizures_description: swimmer.seizures_description,
          important_notes: swimmer.important_notes || [],
          // Parent contact information
          parent_phone: swimmer.parent_phone || null,
          parent_email: swimmer.parent_email || null
        }
      })
      .filter(Boolean) as SessionWithSwimmer[]

    return sessionsWithSwimmers

  } catch (error) {
    console.error('Error in fetchTodaySessions:', error)
    throw error
  }
}

export default function StaffScheduleView() {
  const router = useRouter()
  const { selectedInstructor, clearInstructor } = useStaffMode()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['todaySessions', selectedInstructor?.id],
    queryFn: () => selectedInstructor ? fetchTodaySessions(selectedInstructor.id) : Promise.resolve([]),
    enabled: !!selectedInstructor,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!sessions) return []

    if (!searchQuery.trim()) return sessions

    const query = searchQuery.toLowerCase()
    return sessions.filter(session =>
      session.first_name.toLowerCase().includes(query) ||
      session.last_name.toLowerCase().includes(query) ||
      `${session.first_name} ${session.last_name}`.toLowerCase().includes(query)
    )
  }, [sessions, searchQuery])


  const handleBack = () => {
    clearInstructor()
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  if (!selectedInstructor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No instructor selected</h3>
          <p className="text-gray-500 mt-2">Please select an instructor to view today's schedule.</p>
          <Button
            className="mt-6 bg-[#2a5e84] hover:bg-[#1e4565]"
            onClick={() => router.push('/staff-mode')}
          >
            Select Instructor
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#2a5e84]">Today's Schedule</h1>
              <p className="text-gray-600">{format(new Date(), 'EEEE, MMM d')}</p>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#6abedc]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#2a5e84]">Today's Schedule</h1>
              <p className="text-gray-600">{format(new Date(), 'EEEE, MMM d')}</p>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 font-medium">Error loading schedule</p>
                <p className="text-red-500 text-sm mt-2">
                  {error instanceof Error ? error.message : 'Failed to fetch today\'s schedule'}
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
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-12 w-12 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#2a5e84]">Today's Schedule</h1>
            <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} today
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-[#6abedc]">
              {selectedInstructor.avatarUrl ? (
                <AvatarImage
                  src={selectedInstructor.avatarUrl}
                  alt={selectedInstructor.name}
                />
              ) : null}
              <AvatarFallback className="bg-[#2a5e84] text-white">
                {getInitials(selectedInstructor.name, '')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="font-medium text-gray-900">{selectedInstructor.name}</p>
              <p className="text-sm text-gray-500">Instructor</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearInstructor}
              className="h-10 w-10 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search swimmers by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Session count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2a5e84]" />
            <span className="font-medium text-gray-700">
              {filteredSessions.length} swimmer{filteredSessions.length !== 1 ? 's' : ''} today
            </span>
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Session List - Agenda Style */}
        {filteredSessions.length > 0 ? (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const sessionTime = new Date(session.start_time)
              const now = new Date()
              const isPast = sessionTime < now
              const isNow = Math.abs(sessionTime.getTime() - now.getTime()) < 30 * 60 * 1000 // Within 30 min
              const canUpdateProgress = sessionTime <= now // At or after session time

              // Calculate age
              const age = session.date_of_birth
                ? Math.floor((now.getTime() - new Date(session.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null

              // Collect safety issues
              const safetyIssues = []
              if (session.has_allergies && session.allergies_description) {
                safetyIssues.push(`Allergies: ${session.allergies_description}`)
              }
              if (session.has_medical_conditions && session.medical_conditions_description) {
                safetyIssues.push(`Medical Conditions: ${session.medical_conditions_description}`)
              }
              if (session.history_of_seizures && session.seizures_description) {
                safetyIssues.push(`Seizures: ${session.seizures_description}`)
              }
              if (session.important_notes && session.important_notes.length > 0) {
                session.important_notes.forEach(note => safetyIssues.push(note))
              }
              const hasSafetyWarning = safetyIssues.length > 0

              return (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-all',
                    isPast && 'bg-gray-50 opacity-75',
                    isNow && 'bg-blue-50 border-blue-300 shadow-md',
                    !isPast && !isNow && 'bg-white hover:shadow-sm'
                  )}
                >
                  {/* Time Column */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    {isNow && (
                      <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full mb-1">
                        NOW
                      </span>
                    )}
                    <span className={cn(
                      'text-lg font-semibold',
                      isNow ? 'text-blue-700' : isPast ? 'text-gray-400' : 'text-gray-700'
                    )}>
                      {format(sessionTime, 'h:mm a')}
                    </span>
                  </div>

                  {/* Swimmer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        'h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold',
                        isPast ? 'bg-gray-400' : 'bg-[#2a5e84]'
                      )}>
                        {session.first_name?.[0]}{session.last_name?.[0]}
                      </div>

                      {/* Name & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {session.first_name} {session.last_name}
                          </h3>
                          {hasSafetyWarning && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="h-11 w-11 flex items-center justify-center hover:bg-amber-50 rounded-md transition-colors"
                                  aria-label="View important safety notes"
                                >
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-amber-50 border-amber-200">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Safety Information
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                                    {safetyIssues.map((issue, idx) => (
                                      <li key={idx}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {age && <span>{age}y</span>}
                          {session.level_name && (
                            <>
                              <span>•</span>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                session.level_name === 'white' && 'bg-gray-100 text-gray-700',
                                session.level_name === 'red' && 'bg-red-100 text-red-700',
                                session.level_name === 'yellow' && 'bg-yellow-100 text-yellow-700',
                                session.level_name === 'green' && 'bg-green-100 text-green-700',
                                session.level_name === 'blue' && 'bg-blue-100 text-blue-700',
                              )}>
                                {session.level_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {canUpdateProgress ? (
                      <Button
                        onClick={() => router.push(`/staff-mode/swimmer/${session.swimmer_id}`)}
                        className="bg-[#2a5e84] hover:bg-[#1e4a6d] text-white"
                      >
                        Update Progress
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/staff-mode/swimmer/${session.swimmer_id}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">
                  {searchQuery ? 'No matching swimmers found' : 'No sessions scheduled for today'}
                </h3>
                <p className="text-gray-500 mt-2">
                  {searchQuery
                    ? 'Try a different search term or clear the search to see all swimmers.'
                    : 'There are no scheduled sessions for today. Enjoy your day off!'}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer note */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Staff Mode • {selectedInstructor.name}'s Schedule • {format(new Date(), 'MMM d, yyyy')}</p>
          <p className="mt-1">Click on any swimmer to view detailed progress and update skills.</p>
        </div>
      </div>
    </div>
  )
}