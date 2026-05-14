'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { GradientButton } from '@/components/ui/gradient-button'
import { ExpandableSwimmerCard } from '@/components/parent/expandable-swimmer-card'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: string
  height?: string | number
  weight?: string | number
  photo_url?: string
  enrollment_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
  payment_type?: string
  funding_source_id?: boolean
  funding_source_name?: string
  funding_coordinator_name?: string
  funding_coordinator_email?: string
  funding_coordinator_phone?: string
  authorized_sessions_used?: number
  authorized_sessions_total?: number
  lessons_completed?: number
  next_session?: {
    start_time?: string
    instructor_name?: string
  }
  // Medical
  diagnosis?: string[]
  has_allergies?: boolean
  allergies_description?: string
  has_medical_conditions?: boolean
  medical_conditions_description?: string
  history_of_seizures?: boolean
  seizures_description?: string
  toilet_trained?: string
  non_ambulatory?: boolean
  // Behavioral
  self_injurious_behavior?: boolean
  self_injurious_behavior_description?: string
  aggressive_behavior?: boolean
  aggressive_behavior_description?: string
  elopement_history?: boolean
  elopement_history_description?: string
  has_behavior_plan?: boolean
  restraint_history?: boolean
  restraint_history_description?: string
  // Fundamental
  communication_type?: string | string[]
  strengths_interests?: string
  other_therapies?: boolean
  therapies_description?: string
  // Swim background
  swim_goals?: string[]
  previous_swim_lessons?: boolean
  comfortable_in_water?: string
  // Scheduling
  flexible_swimmer?: boolean
  // Emergency contact
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  // Parent contact info (for reference)
  parent_phone?: string
  parent_email?: string
}

interface ApiSwimmer {
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  height?: string | number
  weight?: string | number
  photoUrl?: string
  enrollmentStatus: string
  currentLevel?: {
    name: string
    displayName: string
    color?: string
  }
  paymentType?: string
  fundingSourceId?: string
  fundingSourceName?: string
  fundingSource?: {
    id: string
    name: string
    requiresAuthorization: boolean
    type: string
  }
  activePurchaseOrder?: {
    sessionsAuthorized: number
    sessionsUsed: number
    unexcusedLateCancelCount: number
  } | null
  coordinatorName?: string
  coordinatorEmail?: string
  coordinatorPhone?: string
  authorizedSessionsUsed?: number
  authorizedSessionsTotal?: number
  lessonsCompleted?: number
  nextSession?: {
    startTime?: string
    instructorName?: string
  }
  diagnosis?: string[]
  hasAllergies?: boolean
  allergiesDescription?: string
  hasMedicalConditions?: boolean
  medicalConditionsDescription?: string
  historyOfSeizures?: boolean
  seizuresDescription?: string
  toiletTrained?: string
  nonAmbulatory?: boolean
  selfInjuriousBehavior?: boolean
  selfInjuriousBehaviorDescription?: string
  aggressiveBehavior?: boolean
  aggressiveBehaviorDescription?: string
  elopementHistory?: boolean
  elopementHistoryDescription?: string
  hasBehaviorPlan?: boolean
  restraintHistory?: boolean
  restraintHistoryDescription?: string
  communicationType?: string | string[]
  strengthsInterests?: string
  otherTherapies?: boolean
  therapiesDescription?: string
  swimGoals?: string[]
  previousSwimLessons?: boolean
  comfortableInWater?: string
  flexibleSwimmer?: boolean
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
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
        const json = await response.json()
        // API returns { swimmers, metadata }
        const apiSwimmers: ApiSwimmer[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.swimmers)
            ? json.swimmers
            : []

        // Transform API response to match SwimmerCard interface
        const transformedData = apiSwimmers.map((swimmer: ApiSwimmer) => ({
          id: swimmer.id,
          first_name: swimmer.firstName,
          last_name: swimmer.lastName,
          date_of_birth: swimmer.dateOfBirth,
          gender: swimmer.gender,
          height: swimmer.height,
          weight: swimmer.weight,
          photo_url: swimmer.photoUrl,
          enrollment_status: swimmer.enrollmentStatus,
          current_level: swimmer.currentLevel ? {
            name: swimmer.currentLevel.name,
            display_name: swimmer.currentLevel.displayName,
            color: swimmer.currentLevel.color
          } : undefined,
          payment_type: swimmer.paymentType,
          funding_source_id: !!swimmer.fundingSourceId, // Convert to boolean (existing badge logic depends on this)
          funding_source_name: swimmer.fundingSourceName,
          funding_source_requires_authorization: swimmer.fundingSource?.requiresAuthorization === true,
          active_purchase_order: swimmer.activePurchaseOrder ? {
            sessions_authorized: swimmer.activePurchaseOrder.sessionsAuthorized,
            sessions_used: swimmer.activePurchaseOrder.sessionsUsed,
            unexcused_late_cancel_count: swimmer.activePurchaseOrder.unexcusedLateCancelCount,
            sessions_remaining: swimmer.activePurchaseOrder.sessionsAuthorized - swimmer.activePurchaseOrder.sessionsUsed,
          } : null,
          funding_coordinator_name: swimmer.coordinatorName,
          funding_coordinator_email: swimmer.coordinatorEmail,
          funding_coordinator_phone: swimmer.coordinatorPhone,
          authorized_sessions_used: swimmer.authorizedSessionsUsed,
          authorized_sessions_total: swimmer.authorizedSessionsTotal,
          lessons_completed: swimmer.lessonsCompleted,
          next_session: swimmer.nextSession ? {
            start_time: swimmer.nextSession.startTime,
            instructor_name: swimmer.nextSession.instructorName
          } : undefined,
          // Medical
          diagnosis: swimmer.diagnosis,
          has_allergies: swimmer.hasAllergies,
          allergies_description: swimmer.allergiesDescription,
          has_medical_conditions: swimmer.hasMedicalConditions,
          medical_conditions_description: swimmer.medicalConditionsDescription,
          history_of_seizures: swimmer.historyOfSeizures,
          seizures_description: swimmer.seizuresDescription,
          toilet_trained: swimmer.toiletTrained,
          non_ambulatory: swimmer.nonAmbulatory,
          // Behavioral
          self_injurious_behavior: swimmer.selfInjuriousBehavior,
          self_injurious_behavior_description: swimmer.selfInjuriousBehaviorDescription,
          aggressive_behavior: swimmer.aggressiveBehavior,
          aggressive_behavior_description: swimmer.aggressiveBehaviorDescription,
          elopement_history: swimmer.elopementHistory,
          elopement_history_description: swimmer.elopementHistoryDescription,
          has_behavior_plan: swimmer.hasBehaviorPlan,
          restraint_history: swimmer.restraintHistory,
          restraint_history_description: swimmer.restraintHistoryDescription,
          // Fundamental
          communication_type: swimmer.communicationType,
          strengths_interests: swimmer.strengthsInterests,
          other_therapies: swimmer.otherTherapies,
          therapies_description: swimmer.therapiesDescription,
          // Swim background
          swim_goals: swimmer.swimGoals,
          previous_swim_lessons: swimmer.previousSwimLessons,
          comfortable_in_water: swimmer.comfortableInWater,
          // Scheduling
          flexible_swimmer: swimmer.flexibleSwimmer,
          // Emergency contact
          emergency_contact_name: swimmer.emergencyContactName,
          emergency_contact_phone: swimmer.emergencyContactPhone,
          emergency_contact_relationship: swimmer.emergencyContactRelationship,
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
              gender,
              height,
              weight,
              photo_url,
              enrollment_status,
              payment_type,
              funding_source_id,
              funding_coordinator_name,
              funding_coordinator_email,
              funding_coordinator_phone,
              authorized_sessions_used,
              authorized_sessions_total,
              diagnosis,
              swim_goals,
              has_allergies,
              allergies_description,
              has_medical_conditions,
              medical_conditions_description,
              history_of_seizures,
              seizures_description,
              toilet_trained,
              non_ambulatory,
              self_injurious_behavior,
              self_injurious_behavior_description,
              aggressive_behavior,
              aggressive_behavior_description,
              elopement_history,
              elopement_history_description,
              has_behavior_plan,
              restraint_history,
              restraint_history_description,
              communication_type,
              strengths_interests,
              other_therapies,
              therapies_description,
              previous_swim_lessons,
              comfortable_in_water,
              flexible_swimmer,
              emergency_contact_name,
              emergency_contact_phone,
              emergency_contact_relationship,
              current_level:swim_levels(name, display_name, color),
              funding_source:funding_source_id(name)
            `)
            .eq('parent_id', user.id)
            .order('first_name')

          if (error) throw error

          // Add parent contact info to each swimmer and convert funding_source_id to boolean
          const swimmersWithParentInfo = (data || []).map((swimmer: any) => ({
            ...swimmer,
            funding_source_id: !!swimmer.funding_source_id, // Convert to boolean
            funding_source_name: swimmer.funding_source?.name,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-full">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
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