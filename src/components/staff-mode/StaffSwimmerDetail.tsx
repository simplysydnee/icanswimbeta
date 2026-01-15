'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStaffMode } from './StaffModeContext'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, differenceInYears } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Phone, Mail, User, AlertTriangle, FileText, Target, Brain, MessageSquare, Stethoscope, Users, Calendar, Award, CheckCircle } from 'lucide-react'
import { AssessmentTab, ProgressTab, TargetsTab, StrategiesTab, NotesTab } from './tabs'

interface SwimmerDetail {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string | null
  photo_url: string | null
  current_level_id: string
  level_name: string
  level_sequence: number
  assessment_status: string | null
  important_info: string[] | null

  // Medical fields
  diagnosis: string | null
  has_allergies: boolean
  allergies_description: string | null
  has_medical_conditions: boolean
  medical_conditions_description: string | null
  history_of_seizures: boolean
  seizures_description: string | null
  toilet_trained: boolean
  non_ambulatory: boolean

  // Behavioral fields
  self_injurious_behavior: boolean
  aggressive_behavior: boolean
  elopement_history: boolean
  has_behavior_plan: boolean

  // Parent info
  parent_id: string | null
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null

  // Skills and progress
  mastered_skills_count: number
  total_skills_count: number

  // Counts for tabs
  targets_count: number
  strategies_count: number
  notes_count: number
}

async function fetchSwimmerDetail(swimmerId: string): Promise<SwimmerDetail> {
  const supabase = createClient()

  try {
    // Fetch swimmer with level and parent info
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        *,
        swim_levels!inner (
          name,
          sequence
        ),
        profiles!swimmers_parent_id_fkey (
          full_name,
          phone,
          email
        )
      `)
      .eq('id', swimmerId)
      .single()

    if (swimmerError) {
      console.error('Error fetching swimmer:', swimmerError)
      throw new Error('Failed to fetch swimmer details')
    }

    // Fetch skills for progress calculation
    const { data: skills, error: skillsError } = await supabase
      .from('swimmer_skills')
      .select('status')
      .eq('swimmer_id', swimmerId)

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      throw new Error('Failed to fetch swimmer skills')
    }

    // Count mastered skills
    const masteredSkills = skills?.filter(skill => skill.status === 'mastered').length || 0
    const totalSkills = skills?.length || 0

    // Fetch counts for tabs
    const { data: targets, error: targetsError } = await supabase
      .from('swimmer_targets')
      .select('id')
      .eq('swimmer_id', swimmerId)

    if (targetsError) {
      console.error('Error fetching targets:', targetsError)
      throw new Error('Failed to fetch targets')
    }

    const { data: strategies, error: strategiesError } = await supabase
      .from('swimmer_strategies')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .eq('is_used', true)

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      throw new Error('Failed to fetch strategies')
    }

    const { data: notes, error: notesError } = await supabase
      .from('progress_notes')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notesError) {
      console.error('Error fetching notes:', notesError)
      throw new Error('Failed to fetch progress notes')
    }

    // Transform the data
    const parentProfile = swimmer.profiles?.[0] || {}

    return {
      id: swimmer.id,
      first_name: swimmer.first_name,
      last_name: swimmer.last_name,
      date_of_birth: swimmer.date_of_birth,
      gender: swimmer.gender,
      photo_url: swimmer.photo_url,
      current_level_id: swimmer.current_level_id,
      level_name: swimmer.swim_levels?.name || 'Unknown',
      level_sequence: swimmer.swim_levels?.sequence || 0,
      assessment_status: swimmer.assessment_status,
      important_info: swimmer.important_info,

      // Medical fields
      diagnosis: swimmer.diagnosis,
      has_allergies: swimmer.has_allergies || false,
      allergies_description: swimmer.allergies_description,
      has_medical_conditions: swimmer.has_medical_conditions || false,
      medical_conditions_description: swimmer.medical_conditions_description,
      history_of_seizures: swimmer.history_of_seizures || false,
      seizures_description: swimmer.seizures_description,
      toilet_trained: swimmer.toilet_trained || false,
      non_ambulatory: swimmer.non_ambulatory || false,

      // Behavioral fields
      self_injurious_behavior: swimmer.self_injurious_behavior || false,
      aggressive_behavior: swimmer.aggressive_behavior || false,
      elopement_history: swimmer.elopement_history || false,
      has_behavior_plan: swimmer.has_behavior_plan || false,

      // Parent info
      parent_id: swimmer.parent_id,
      parent_name: parentProfile.full_name || null,
      parent_phone: parentProfile.phone || null,
      parent_email: parentProfile.email || null,

      // Skills and progress
      mastered_skills_count: masteredSkills,
      total_skills_count: totalSkills,

      // Counts for tabs
      targets_count: targets?.length || 0,
      strategies_count: strategies?.length || 0,
      notes_count: notes?.length || 0
    }

  } catch (error) {
    console.error('Error in fetchSwimmerDetail:', error)
    throw error
  }
}

interface StaffSwimmerDetailProps {
  swimmerId: string
}

export default function StaffSwimmerDetail({ swimmerId }: StaffSwimmerDetailProps) {
  const router = useRouter()
  const { selectedInstructor } = useStaffMode()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('progress')

  const { data: swimmer, isLoading, error } = useQuery({
    queryKey: ['swimmerDetail', swimmerId],
    queryFn: () => fetchSwimmerDetail(swimmerId),
    enabled: !!swimmerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleBack = () => {
    router.push('/staff-mode/schedule')
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

  const calculateProgress = (mastered: number, total: number, levelSequence: number) => {
    if (total === 0) return 0

    // Red/White group (levels 1-2): 9 total skills
    // Yellow/Green/Blue group (levels 3-5): 12 total skills
    const maxSkills = levelSequence <= 2 ? 9 : 12
    const actualTotal = Math.min(total, maxSkills)
    const percentage = Math.round((mastered / actualTotal) * 100)
    return Math.min(percentage, 100)
  }

  const getLevelBadge = (sequence: number) => {
    if (sequence <= 2) {
      return '🔴⚪' // Red/White group
    } else {
      return '🟡🟢🔵' // Yellow/Green/Blue group
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white">
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" disabled>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#6abedc]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !swimmer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white">
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Swimmer Details</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 font-medium">Error loading swimmer details</p>
                <p className="text-red-500 text-sm mt-2">
                  {error instanceof Error ? error.message : 'Failed to fetch swimmer details'}
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="default"
                    className="bg-[#2a5e84] hover:bg-[#1e4565]"
                    onClick={handleBack}
                  >
                    Back to Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const age = calculateAge(swimmer.date_of_birth)
  const progress = calculateProgress(
    swimmer.mastered_skills_count,
    swimmer.total_skills_count,
    swimmer.level_sequence
  )
  const isAssessment = swimmer.assessment_status === 'scheduled'
  const hasImportantInfo = swimmer.important_info && swimmer.important_info.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4f8] to-white">
      {/* Persistent Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Top row: Back button and basic info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-12 w-12 rounded-full shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Swimmer avatar with level badge */}
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-[#6abedc]">
                      {swimmer.photo_url ? (
                        <AvatarImage
                          src={swimmer.photo_url}
                          alt={`${swimmer.first_name} ${swimmer.last_name}`}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-[#2a5e84] text-white text-2xl font-semibold">
                        {getInitials(swimmer.first_name, swimmer.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border-2 border-white shadow-md">
                      <div className="text-2xl">
                        {getLevelBadge(swimmer.level_sequence)}
                      </div>
                    </div>
                  </div>

                  {/* Name and basic info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900 truncate">
                        {swimmer.first_name} {swimmer.last_name}
                      </h1>
                      <Badge variant="outline" className="text-[#2a5e84] border-[#2a5e84]">
                        {swimmer.level_name}
                      </Badge>
                      {isAssessment && (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          <Target className="h-3 w-3 mr-1" />
                          Assessment
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{age} years old</span>
                        <span className="text-gray-400">•</span>
                        <span>Born {formatDate(swimmer.date_of_birth)}</span>
                      </div>

                      {swimmer.gender && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 capitalize">{swimmer.gender}</span>
                        </>
                      )}
                    </div>

                    {/* Parent contact */}
                    {(swimmer.parent_name || swimmer.parent_phone || swimmer.parent_email) && (
                      <div className="mt-3 flex items-center gap-4 flex-wrap">
                        {swimmer.parent_name && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{swimmer.parent_name}</span>
                          </div>
                        )}

                        {swimmer.parent_phone && (
                          <a
                            href={`tel:${swimmer.parent_phone}`}
                            className="flex items-center gap-2 text-[#2a5e84] hover:text-[#1e4565] hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{swimmer.parent_phone}</span>
                          </a>
                        )}

                        {swimmer.parent_email && (
                          <a
                            href={`mailto:${swimmer.parent_email}`}
                            className="flex items-center gap-2 text-[#2a5e84] hover:text-[#1e4565] hover:underline"
                          >
                            <Mail className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{swimmer.parent_email}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress ring */}
                  <div className="shrink-0">
                    <div className="relative h-20 w-20">
                      <svg className="h-20 w-20" viewBox="0 0 36 36">
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                        <span className="text-xs text-gray-600">Progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Info Box */}
            {hasImportantInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Important Information</h3>
                </div>
                <div className="space-y-1">
                  {swimmer.important_info!.map((info, index) => (
                    <p key={index} className="text-amber-700 text-sm">
                      • {info}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-12">
              <TabsTrigger value="profile" className="flex items-center gap-2 px-4">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>

              <TabsTrigger value="assessment" className="flex items-center gap-2 px-4">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Assessment</span>
                {isAssessment && (
                  <Badge className="ml-1 h-5 w-5 p-0 bg-amber-500 hover:bg-amber-600">
                    !
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="progress" className="flex items-center gap-2 px-4">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0">
                  {swimmer.total_skills_count}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="targets" className="flex items-center gap-2 px-4">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Targets</span>
                {swimmer.targets_count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0">
                    {swimmer.targets_count}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="strategies" className="flex items-center gap-2 px-4">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Strategies</span>
                {swimmer.strategies_count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0">
                    {swimmer.strategies_count}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="notes" className="flex items-center gap-2 px-4">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
                {swimmer.notes_count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0">
                    {swimmer.notes_count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{swimmer.first_name} {swimmer.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium">{formatDate(swimmer.date_of_birth)} ({age} years old)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-medium capitalize">{swimmer.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Level</p>
                        <p className="font-medium">{swimmer.level_name} (Sequence {swimmer.level_sequence})</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Medical Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Diagnosis</p>
                        <p className="font-medium">{swimmer.diagnosis || 'None specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Allergies</p>
                        <p className="font-medium">
                          {swimmer.has_allergies ? swimmer.allergies_description || 'Yes' : 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Medical Conditions</p>
                        <p className="font-medium">
                          {swimmer.has_medical_conditions ? swimmer.medical_conditions_description || 'Yes' : 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Seizure History</p>
                        <p className="font-medium">
                          {swimmer.history_of_seizures ? swimmer.seizures_description || 'Yes' : 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Toilet Trained</p>
                        <p className="font-medium">{swimmer.toilet_trained ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Non-Ambulatory</p>
                        <p className="font-medium">{swimmer.non_ambulatory ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Behavioral Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Self-Injurious Behavior</p>
                        <p className="font-medium">{swimmer.self_injurious_behavior ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Aggressive Behavior</p>
                        <p className="font-medium">{swimmer.aggressive_behavior ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Elopement History</p>
                        <p className="font-medium">{swimmer.elopement_history ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Behavior Plan</p>
                        <p className="font-medium">{swimmer.has_behavior_plan ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Contacts */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Family Contacts
                    </h3>
                    <div className="space-y-3">
                      {swimmer.parent_name && (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{swimmer.parent_name}</p>
                            <div className="flex items-center gap-4 mt-1">
                              {swimmer.parent_phone && (
                                <a
                                  href={`tel:${swimmer.parent_phone}`}
                                  className="text-sm text-[#2a5e84] hover:text-[#1e4565] hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  {swimmer.parent_phone}
                                </a>
                              )}
                              {swimmer.parent_email && (
                                <a
                                  href={`mailto:${swimmer.parent_email}`}
                                  className="text-sm text-[#2a5e84] hover:text-[#1e4565] hover:underline flex items-center gap-1"
                                >
                                  <Mail className="h-3 w-3" />
                                  {swimmer.parent_email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="mt-0">
            <AssessmentTab
              swimmerId={swimmerId}
              swimmerName={`${swimmer.first_name} ${swimmer.last_name}`}
              assessmentStatus={swimmer.assessment_status}
            />
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-0">
            <ProgressTab
              swimmerId={swimmerId}
              currentLevelId={swimmer.current_level_id}
              levelSequence={swimmer.level_sequence}
              levelName={swimmer.level_name}
              instructorId={selectedInstructor?.id || ''}
            />
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="mt-0">
            <TargetsTab
              swimmerId={swimmerId}
              instructorId={selectedInstructor?.id || ''}
            />
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="mt-0">
            <StrategiesTab
              swimmerId={swimmerId}
              instructorId={selectedInstructor?.id || ''}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-0">
            <NotesTab
              swimmerId={swimmerId}
              instructorId={selectedInstructor?.id || ''}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 py-4 border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          <p>Staff Mode • {selectedInstructor?.name || 'Instructor'}'s Swimmer • {swimmer.first_name} {swimmer.last_name}</p>
          <p className="mt-1">Use the tabs above to view and manage different aspects of this swimmer's profile.</p>
        </div>
      </div>
    </div>
  )
}