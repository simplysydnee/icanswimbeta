'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStaffMode } from './StaffModeContext'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, isToday, isPast, isFuture, differenceInYears } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Search, Calendar, User, Target, Clock, Users, LogOut } from 'lucide-react'

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
  important_notes: string[] | null
  // Parent contact information
  parent_phone: string | null
  parent_email: string | null
}

async function fetchTodaySessions(instructorId: string): Promise<SessionWithSwimmer[]> {
  const supabase = createClient()

  try {
    // Get today's date in local timezone (YYYY-MM-DD format)
    const today = new Date().toLocaleDateString('en-CA')

    // Fetch today's sessions for this instructor
    // Use timestamp range: from midnight to 11:59:59 PM on today's date

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        bookings!inner (
          swimmer_id
        )
      `)
      .eq('instructor_id', instructorId)
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)
      .in('status', ['booked', 'open', 'available']) // Sessions that are booked or available
      .order('start_time')

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      throw new Error('Failed to fetch today\'s sessions')
    }

    console.log('=== DEBUG StaffScheduleView: Sessions found ===')
    console.log('Number of sessions:', sessions?.length || 0)
    console.log('Sessions:', sessions)

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
          parent_phone: swimmer.profiles?.phone || null,
          parent_email: swimmer.profiles?.email || null
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
  const { toast } = useToast()
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

  // Find the next upcoming session
  const nextSession = useMemo(() => {
    if (!sessions) return null

    const now = new Date()
    return sessions.find(session => {
      const sessionTime = parseISO(session.start_time)
      return isFuture(sessionTime) || isToday(sessionTime)
    })
  }, [sessions])

  const handleBack = () => {
    clearInstructor()
  }

  const handleSwimmerClick = (swimmerId: string) => {
    router.push(`/staff-mode/swimmer/${swimmerId}`)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth))
    } catch {
      return 0
    }
  }

  const getLevelBadge = (sequence: number) => {
    if (sequence <= 2) {
      return '🔴⚪' // Red/White group
    } else {
      return '🟡🟢🔵' // Yellow/Green/Blue group
    }
  }

  const calculateProgress = (mastered: number, total: number, levelSequence: number) => {
    if (total === 0) return 0

    // Red/White group (levels 1-2): 9 total skills
    // Yellow/Green/Blue group (levels 3-5): 12 total skills
    const maxSkills = levelSequence <= 2 ? 9 : 12
    const actualTotal = Math.min(total, maxSkills)
    const percentage = Math.round((mastered / actualTotal) * 100)
    return Math.min(percentage, 100)
  }

  const hasImportantInfo = (session: SessionWithSwimmer) => {
    return session.important_notes && session.important_notes.length > 0
  }

  const getImportantNotes = (session: SessionWithSwimmer) => {
    if (!session.important_notes || session.important_notes.length === 0) {
      return []
    }
    return session.important_notes
  }

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a')
    } catch {
      return timeString
    }
  }

  const getTimeBadgeVariant = (session: SessionWithSwimmer) => {
    if (nextSession?.id === session.id) {
      return 'next' as const
    }

    const sessionTime = parseISO(session.start_time)
    if (isPast(sessionTime) && !isToday(sessionTime)) {
      return 'secondary' as const
    }

    return 'default' as const
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
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'EEEE, MMM d')}
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

        {/* Swimmer cards - Grid layout for iPad */}
        {filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const age = calculateAge(session.date_of_birth)
              const progress = calculateProgress(
                session.mastered_skills_count,
                session.total_skills_count,
                session.level_sequence
              )
              const isAssessment = session.assessment_status === 'scheduled'
              const timeBadgeVariant = getTimeBadgeVariant(session)

              return (
                <Card
                  key={session.id}
                  className="cursor-pointer transition-all hover:shadow-lg border-[#6abedc]/30 hover:border-[#2a5e84] h-full flex flex-col"
                  onClick={() => handleSwimmerClick(session.swimmer_id)}
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Compact header with time, name, and alerts */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            timeBadgeVariant === 'next'
                              ? 'bg-[#06b6d4] hover:bg-[#06b6d4] text-white'
                              : ''
                          }`}
                          variant={timeBadgeVariant === 'next' ? 'default' : timeBadgeVariant}
                          size="sm"
                        >
                          {timeBadgeVariant === 'next' ? 'NEXT' : <Clock className="h-3 w-3" />}
                        </Badge>
                        <span className="font-bold text-gray-900">
                          {formatTime(session.start_time)}
                        </span>
                        {/* Warning badge for important info */}
                        {hasImportantInfo(session) && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-300 text-xs"
                            size="sm"
                          >
                            ⚠️
                          </Badge>
                        )}
                      </div>
                      <div className="text-xl">
                        {getLevelBadge(session.level_sequence)}
                      </div>
                    </div>

                    {/* Swimmer info - compact layout */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Swimmer avatar - smaller */}
                      <Avatar className="h-12 w-12 border-2 border-[#6abedc]">
                        {session.photo_url ? (
                          <AvatarImage
                            src={session.photo_url}
                            alt={`${session.first_name} ${session.last_name}`}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-[#2a5e84] text-white text-sm font-semibold">
                          {getInitials(session.first_name, session.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {session.first_name} {session.last_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{age > 0 ? `${age}y` : 'Infant'}</span>
                          <span>•</span>
                          <span className="truncate">{session.level_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Important notes - yellow attention box */}
                    {hasImportantInfo(session) && (
                      <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <div className="flex items-start gap-1">
                          <span className="text-amber-700">⚠️</span>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Important Notes:</div>
                            <div className="text-xs text-amber-700 space-y-1">
                              {getImportantNotes(session).map((note, index) => (
                                <div key={index} className="truncate">
                                  • {note}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress or Assessment - compact */}
                    <div className="mb-3">
                      {isAssessment ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs w-full justify-center">
                          <Target className="h-3 w-3 mr-1" />
                          Assessment
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative h-8 w-8">
                              <svg className="h-8 w-8" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#2a5e84"
                                  strokeWidth="3"
                                  strokeDasharray={`${progress}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold">{progress}%</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {session.mastered_skills_count}/{session.level_sequence <= 2 ? 9 : 12}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Strategies - compact */}
                    {session.strategies.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {session.strategies.slice(0, 2).map((strategy, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-[#e8f4f8] text-[#2a5e84] border-[#6abedc]/30 text-xs"
                            >
                              {strategy.length > 12 ? `${strategy.substring(0, 12)}...` : strategy}
                            </Badge>
                          ))}
                          {session.strategies.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.strategies.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact information - compact */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {session.parent_phone && (
                          <div className="truncate" title={`Phone: ${session.parent_phone}`}>
                            📞 {session.parent_phone.length > 10 ? `${session.parent_phone.substring(0, 10)}...` : session.parent_phone}
                          </div>
                        )}
                        {session.parent_email && (
                          <div className="truncate" title={`Email: ${session.parent_email}`}>
                            ✉️ {session.parent_email.length > 15 ? `${session.parent_email.substring(0, 15)}...` : session.parent_email}
                          </div>
                        )}
                        {!session.parent_phone && !session.parent_email && (
                          <div className="text-gray-400 italic">No contact info</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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