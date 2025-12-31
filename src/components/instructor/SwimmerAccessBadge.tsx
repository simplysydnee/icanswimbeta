'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface Props {
  swimmerId: string
  instructorId: string
}

export function SwimmerAccessBadge({ swimmerId, instructorId }: Props) {
  const supabase = createClient()

  const { data: accessInfo, isLoading } = useQuery({
    queryKey: ['swimmer-access-info', swimmerId, instructorId],
    queryFn: async () => {
      // Get next session with this swimmer
      const { data: nextSession } = await supabase
        .from('sessions')
        .select('start_time')
        .eq('instructor_id', instructorId)
        .in('id',
          supabase
            .from('bookings')
            .select('session_id')
            .eq('swimmer_id', swimmerId)
            .neq('status', 'cancelled')
        )
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(1)
        .single()

      // Get last session
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('start_time')
        .eq('instructor_id', instructorId)
        .in('id',
          supabase
            .from('bookings')
            .select('session_id')
            .eq('swimmer_id', swimmerId)
            .neq('status', 'cancelled')
        )
        .lt('start_time', new Date().toISOString())
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      return {
        hasUpcoming: !!nextSession,
        nextSessionDate: nextSession?.start_time,
        lastSessionDate: lastSession?.start_time
      }
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  })

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-gray-50">
        <Clock className="w-3 h-3 mr-1 animate-pulse" />
        Checking...
      </Badge>
    )
  }

  if (accessInfo?.hasUpcoming) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    )
  }

  if (accessInfo?.lastSessionDate) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(accessInfo.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysLeft = 7 - daysAgo

    if (daysLeft > 0) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <Clock className="w-3 h-3 mr-1" />
          {daysLeft}d access left
        </Badge>
      )
    }
  }

  // Check if instructor has assignment but no sessions
  const { data: hasAssignment } = useQuery({
    queryKey: ['swimmer-assignment', swimmerId, instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from('swimmer_instructor_assignments')
        .select('id')
        .eq('swimmer_id', swimmerId)
        .eq('instructor_id', instructorId)
        .single()

      return !!data
    },
    staleTime: 1000 * 60 * 10
  })

  if (hasAssignment) {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <AlertCircle className="w-3 h-3 mr-1" />
        Assigned (no sessions)
      </Badge>
    )
  }

  return null
}