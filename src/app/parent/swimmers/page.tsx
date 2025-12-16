'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradientButton } from '@/components/ui/gradient-button'
import { ExpandableSwimmerCard } from '@/components/parent/expandable-swimmer-card'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string
  photo_url?: string
  enrollment_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
  payment_type?: string
  funding_source_id?: string
  lessons_completed?: number
  next_session?: {
    start_time?: string
    instructor_name?: string
  }
  // Additional fields for expanded view
  diagnosis?: string[]
  swim_goals?: string[]
  has_allergies?: boolean
  allergies_description?: string
  has_medical_conditions?: boolean
  medical_conditions_description?: string
  // Parent contact info (for reference)
  parent_phone?: string
  parent_email?: string
}

export default function SwimmersPage() {
  const { user } = useAuth()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSwimmerId, setExpandedSwimmerId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSwimmers = async () => {
      if (!user) return

      try {
        // First, get parent contact info
        const { data: parentData, error: parentError } = await supabase
          .from('profiles')
          .select('phone, email')
          .eq('id', user.id)
          .single()

        if (parentError) {
          console.error('Error fetching parent info:', parentError)
        }

        const parentPhone = parentData?.phone || ''
        const parentEmail = parentData?.email || ''

        // Fetch swimmers
        const response = await fetch('/api/swimmers')
        if (!response.ok) {
          throw new Error('Failed to fetch swimmers')
        }
        const data = await response.json()

        // Transform API response to match SwimmerCard interface
        const transformedData = data.map((swimmer: any) => ({
          id: swimmer.id,
          first_name: swimmer.firstName,
          last_name: swimmer.lastName,
          date_of_birth: swimmer.dateOfBirth,
          photo_url: swimmer.photoUrl,
          enrollment_status: swimmer.enrollmentStatus,
          current_level: swimmer.currentLevel ? {
            name: swimmer.currentLevel.name,
            display_name: swimmer.currentLevel.displayName,
            color: swimmer.currentLevel.color
          } : undefined,
          payment_type: swimmer.paymentType,
          funding_source_id: swimmer.fundingSourceId,
          lessons_completed: swimmer.lessonsCompleted,
          next_session: swimmer.nextSession ? {
            start_time: swimmer.nextSession.startTime,
            instructor_name: swimmer.nextSession.instructorName
          } : undefined,
          // Additional fields for expanded view
          diagnosis: swimmer.diagnosis,
          swim_goals: swimmer.swimGoals,
          has_allergies: swimmer.hasAllergies,
          allergies_description: swimmer.allergiesDescription,
          has_medical_conditions: swimmer.hasMedicalConditions,
          medical_conditions_description: swimmer.medicalConditionsDescription,
          // Parent contact info (for reference)
          parent_phone: parentPhone,
          parent_email: parentEmail
        }))

        setSwimmers(transformedData)
      } catch (error) {
        console.error('Error fetching swimmers:', error)
        // Fallback to direct Supabase query if API fails
        try {
          // Get parent contact info for fallback too
          const { data: parentData, error: parentError } = await supabase
            .from('profiles')
            .select('phone, email')
            .eq('id', user.id)
            .single()

          if (parentError) {
            console.error('Error fetching parent info in fallback:', parentError)
          }

          const parentPhone = parentData?.phone || ''
          const parentEmail = parentData?.email || ''

          const { data, error } = await supabase
            .from('swimmers')
            .select(`
              id,
              first_name,
              last_name,
              date_of_birth,
              photo_url,
              enrollment_status,
              payment_type,
              funding_source_id,
              diagnosis,
              swim_goals,
              has_allergies,
              allergies_description,
              has_medical_conditions,
              medical_conditions_description,
              current_level:swim_levels(name, display_name, color)
            `)
            .eq('parent_id', user.id)
            .order('first_name')

          if (error) throw error

          // Add parent contact info to each swimmer
          const swimmersWithParentInfo = (data || []).map((swimmer: any) => ({
            ...swimmer,
            parent_phone: parentPhone,
            parent_email: parentEmail
          }))

          setSwimmers(swimmersWithParentInfo)
        } catch (fallbackError) {
          console.error('Fallback query error:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSwimmers()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Swimmers</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your swimmers in one place
          </p>
        </div>
        <GradientButton asChild>
          <Link href="/enroll">
            <Plus className="h-4 w-4 mr-2" />
            Add New Swimmer
          </Link>
        </GradientButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.filter(s => s.enrollment_status === 'enrolled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.filter(s => s.enrollment_status === 'waitlist').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.reduce((total, s) => total + (s.lessons_completed || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Swimmers Grid */}
      {swimmers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No swimmers yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first swimmer to get started with swim lessons. You&apos;ll be able to track their progress and book sessions.
              </p>
              <GradientButton asChild>
                <Link href="/enroll">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Swimmer
                </Link>
              </GradientButton>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {swimmers.map((swimmer) => (
            <ExpandableSwimmerCard
              key={swimmer.id}
              swimmer={swimmer}
              isExpanded={expandedSwimmerId === swimmer.id}
              onExpand={() => setExpandedSwimmerId(swimmer.id)}
              onCollapse={() => setExpandedSwimmerId(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}