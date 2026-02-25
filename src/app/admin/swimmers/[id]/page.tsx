'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Edit,
  Users,
  Award,
  FileText,
  Activity,
  Mail,
  Phone,
  AlertTriangle,
  Target,
  Shield,
  DollarSign,
  Loader2,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  Circle,
  UserPlus
} from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { format, parseISO, differenceInYears, formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface Swimmer {
  // Basic info - snake_case
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  photo_url?: string
  enrollment_status: string
  assessment_status: string
  approval_status: string
  // Basic info - camelCase
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  enrollmentStatus?: string
  assessmentStatus?: string
  approvalStatus?: string
  current_level?: {
    name: string
    display_name: string
    description?: string
    color?: string
  }
  currentLevel?: {
    name: string
    display_name: string
    description?: string
    color?: string
  }
  // Medical info - snake_case
  has_allergies: boolean
  allergies_description?: string
  has_medical_conditions: boolean
  medical_conditions_description?: string
  diagnosis?: string[]
  history_of_seizures: boolean
  toilet_trained?: boolean
  non_ambulatory: boolean
  // Medical info - camelCase
  hasAllergies?: boolean
  allergiesDescription?: string
  hasMedicalConditions?: boolean
  medicalConditionsDescription?: string
  historyOfSeizures?: boolean
  seizuresDescription?: string
  toiletTrained?: string
  nonAmbulatory?: boolean
  // Behavioral info - snake_case
  self_injurious_behavior: boolean
  self_injurious_description?: string
  aggressive_behavior: boolean
  aggressive_behavior_description?: string
  elopement_history: boolean
  elopement_description?: string
  // Behavioral info - camelCase
  selfInjuriousBehavior?: boolean
  selfInjuriousBehaviorDescription?: string
  aggressiveBehavior?: boolean
  aggressiveBehaviorDescription?: string
  elopementHistory?: boolean
  elopementHistoryDescription?: string
  hasBehaviorPlan?: boolean
  restraintHistory?: boolean
  restraintHistoryDescription?: string
  // Swimming background - snake_case
  previous_swim_lessons: boolean
  comfortable_in_water: string
  swim_goals?: string[]
  flexible_swimmer: boolean
  // Swimming background - camelCase
  previousSwimLessons?: boolean
  comfortableInWater?: string
  swimGoals?: string[]
  // Funding source info - snake_case
  payment_type: string
  funding_source_id?: string
  funding_coordinator_name?: string
  funding_coordinator_email?: string
  funding_coordinator_phone?: string
  authorized_sessions_used?: number
  authorized_sessions_total?: number
  current_authorization_number?: string
  authorization_expires_at?: string
  // Funding source info - camelCase
  paymentType?: string
  fundingType?: string
  fundingCoordinatorName?: string
  fundingCoordinatorEmail?: string
  fundingCoordinatorPhone?: string
  authorizedSessionsUsed?: number
  authorizedSessionsTotal?: number
  currentAuthorizationNumber?: string
  authorizationExpiresAt?: string
  // Legal - snake_case
  signed_waiver: boolean
  photo_release: boolean
  // Legal - camelCase
  signedWaiver?: boolean
  photoRelease?: boolean
  // Parent info
  parent?: {
    id: string
    full_name?: string
    email?: string
    phone?: string
  }
  // Progress data
  skills?: Array<{
    id: string
    name: string
    description?: string
    sequence: number
    level: {
      id: string
      name: string
      display_name: string
      color?: string
      sequence: number
    }
    status: 'not_started' | 'in_progress' | 'mastered'
    date_mastered?: string
    instructor_notes?: string
  }>
  progress_notes?: Array<{
    id: string
    lesson_summary: string
    instructor_notes?: string
    skills_working_on: string[]
    skills_mastered: string[]
    created_at: string
    instructor: {
      full_name?: string
    }
    session?: {
      start_time: string
      location: string
    }
  }>
  // Additional fields
  height?: string
  weight?: string
  // Timestamps - snake_case
  created_at: string
  updated_at: string
  // Timestamps - camelCase
  createdAt?: string
  updatedAt?: string
}

// Status badge colors
const statusColors: Record<string, string> = {
  enrolled: "bg-green-100 text-green-800 border-green-200",
  waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  dropped: "bg-red-100 text-red-800 border-red-200",
}

// Payment type colors
const paymentColors: Record<string, string> = {
  private_pay: "bg-blue-100 text-blue-800 border-blue-200",
  funded: "bg-purple-100 text-purple-800 border-purple-200",
  scholarship: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

// Status display names
const statusDisplayNames: Record<string, string> = {
  enrolled: "Enrolled",
  waitlist: "Waitlist",
  pending: "Pending",
  inactive: "Inactive",
  dropped: "Dropped",
}

// Payment type display names
const paymentDisplayNames: Record<string, string> = {
  private_pay: "Private Pay",
  funded: "Funded",
  scholarship: "Scholarship",
  other: "Other",
}

function AdminSwimmerDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const swimmerId = params.id as string
  const defaultTab = searchParams.get('tab') || 'overview'

  const [swimmer, setSwimmer] = useState<Swimmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [invitingParent, setInvitingParent] = useState(false)
  const { toast } = useToast()

  // Format invitation time display
  const formatInvitationTime = (invitedAt: string) => {
    return formatDistanceToNow(new Date(invitedAt), { addSuffix: true })
  }

  useEffect(() => {
    fetchSwimmerData()
  }, [swimmerId])

  const fetchSwimmerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch swimmer basic info
      const { data: swimmerData, error: swimmerError } = await supabase
        .from('swimmers')
        .select(`
          *,
          parent:profiles(id, full_name, email, phone),
          current_level:swim_levels(*)
        `)
        .eq('id', swimmerId)
        .single()

      if (swimmerError) throw swimmerError

      // Fetch swimmer skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('swimmer_skills')
        .select(`
          id,
          status,
          date_mastered,
          instructor_notes,
          skill:skills(
            id,
            name,
            description,
            sequence,
            level:swim_levels(id, name, display_name, color, sequence)
          )
        `)
        .eq('swimmer_id', swimmerId)

      if (skillsError) throw skillsError

      // Transform skills data
      const transformedSkills = (skillsData || []).map((item: any) => ({
        id: item.skill.id,
        name: item.skill.name,
        description: item.skill.description,
        sequence: item.skill.sequence,
        level: item.skill.level,
        status: item.status,
        date_mastered: item.date_mastered,
        instructor_notes: item.instructor_notes
      })).sort((a, b) => {
        const levelSeqA = a.level?.sequence || 0;
        const levelSeqB = b.level?.sequence || 0;
        if (levelSeqA !== levelSeqB) return levelSeqA - levelSeqB;
        return (a.sequence || 0) - (b.sequence || 0);
      })

      // Fetch progress notes (admin sees all notes including instructor_notes)
      const { data: notesData, error: notesError } = await supabase
        .from('progress_notes')
        .select(`
          id,
          lesson_summary,
          instructor_notes,
          skills_working_on,
          skills_mastered,
          created_at,
          instructor:profiles(full_name),
          session:sessions(start_time, location)
        `)
        .eq('swimmer_id', swimmerId)
        .order('created_at', { ascending: false })

      if (notesError) throw notesError

      // Transform snake_case to camelCase like the API route does
      const transformedSwimmer = {
        // Basic info
        id: swimmerData.id,
        parentId: swimmerData.parent_id,
        firstName: swimmerData.first_name,
        lastName: swimmerData.last_name,
        dateOfBirth: swimmerData.date_of_birth,
        gender: swimmerData.gender,
        height: swimmerData.height,
        weight: swimmerData.weight,
        enrollmentStatus: swimmerData.enrollment_status,
        assessmentStatus: swimmerData.assessment_status,
        approvalStatus: swimmerData.approval_status,
        paymentType: swimmerData.payment_type,
        fundingType: swimmerData.funding_type,
        fundingCoordinatorName: swimmerData.funding_coordinator_name,
        fundingCoordinatorEmail: swimmerData.funding_coordinator_email,
        fundingCoordinatorPhone: swimmerData.funding_coordinator_phone,
        createdAt: swimmerData.created_at,
        updatedAt: swimmerData.updated_at,

        // Parent info
        parent: swimmerData.parent,

        // Current level
        currentLevel: swimmerData.current_level,

        // Medical info
        hasAllergies: swimmerData.has_allergies,
        allergiesDescription: swimmerData.allergies_description,
        hasMedicalConditions: swimmerData.has_medical_conditions,
        medicalConditionsDescription: swimmerData.medical_conditions_description,
        diagnosis: swimmerData.diagnosis,
        historyOfSeizures: swimmerData.history_of_seizures,
        seizuresDescription: swimmerData.seizures_description,

        // Care needs
        toiletTrained: swimmerData.toilet_trained,
        nonAmbulatory: swimmerData.non_ambulatory,
        communicationType: swimmerData.communication_type,
        otherTherapies: swimmerData.other_therapies,
        therapiesDescription: swimmerData.therapies_description,

        // Behavioral
        selfInjuriousBehavior: swimmerData.self_injurious_behavior,
        selfInjuriousBehaviorDescription: swimmerData.self_injurious_behavior_description,
        aggressiveBehavior: swimmerData.aggressive_behavior,
        aggressiveBehaviorDescription: swimmerData.aggressive_behavior_description,
        elopementHistory: swimmerData.elopement_history,
        elopementHistoryDescription: swimmerData.elopement_history_description,
        hasBehaviorPlan: swimmerData.has_behavior_plan,
        restraintHistory: swimmerData.restraint_history,
        restraintHistoryDescription: swimmerData.restraint_history_description,

        // Swimming background
        previousSwimLessons: swimmerData.previous_swim_lessons,
        comfortableInWater: swimmerData.comfortable_in_water,
        swimGoals: swimmerData.swim_goals,
        strengthsInterests: swimmerData.strengths_interests,

        // Keep snake_case fields for backward compatibility
        ...swimmerData,
        skills: transformedSkills,
        progress_notes: notesData || []
      }

      setSwimmer(transformedSwimmer)
    } catch (err) {
      console.error('Error fetching swimmer:', err)
      setError('Failed to load swimmer details')
    } finally {
      setLoading(false)
    }
  }

  const handleBookSession = () => {
    console.log('handleBookSession clicked', { swimmerId })
    router.push(`/admin/bookings?swimmer=${swimmerId}`)
  }

  const handleUpdateInformation = () => {
    console.log('handleUpdateInformation clicked', { swimmerId })
    router.push(`/admin/swimmers/${swimmerId}/edit`)
  }

  const handleAddProgressNote = () => {
    console.log('handleAddProgressNote clicked', { swimmerId })
    router.push(`/instructor/progress?swimmer=${swimmerId}`)
  }

  const handleGenerateReport = async () => {
    if (!swimmer) return

    setIsGeneratingReport(true)
    try {
      const response = await fetch(`/api/swimmers/${swimmerId}/report`)
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${swimmer.first_name}-${swimmer.last_name}-report.pdf`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "The swimmer report has been downloaded.",
      })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleSendToCoordinator = () => {
    console.log('handleSendToCoordinator clicked', { swimmerId })
    if (!swimmer) return

    if (swimmer.payment_type === 'funded' && swimmer.funding_coordinator_email) {
      // Open email composer with mailto link
      const subject = `I Can Swim - Update for ${swimmer.first_name} ${swimmer.last_name}`
      const body = `Dear Coordinator,\n\nPlease find an update regarding ${swimmer.first_name} ${swimmer.last_name}.\n\nThank you,\nThe I Can Swim Team`
      window.location.href = `mailto:${swimmer.funding_coordinator_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else {
      toast({
        title: "No Coordinator Email",
        description: "This swimmer doesn't have a coordinator assigned or is not a funded client.",
        variant: "destructive",
      })
    }
  }

  const handleInviteParent = async () => {
    if (!swimmer?.id) return

    setInvitingParent(true)
    try {
      const response = await fetch(`/api/admin/swimmers/${swimmer.id}/invite-parent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_email: swimmer.parent_email,
          parent_name: swimmer.parent?.full_name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      if (data.linked) {
        toast({
          title: 'Parent account found and linked!',
          description: 'The swimmer has been automatically linked to the existing parent account.',
        })
        // Refresh swimmer data to show updated parent info
        fetchSwimmerData()
      } else {
        toast({
          title: data.isResend ? 'Invitation resent!' : 'Invitation sent!',
          description: data.message,
        })
        // Refresh swimmer data to update invited_at timestamp
        fetchSwimmerData()
      }
    } catch (error) {
      console.error('Error inviting parent:', error)
      toast({
        title: 'Failed to send invitation',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setInvitingParent(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth))
    } catch {
      return null
    }
  }

  // Progress calculation helpers
  const getProgressStats = () => {
    if (!swimmer?.skills) return { mastered: 0, inProgress: 0, total: 0, percentage: 0 }

    const mastered = swimmer.skills.filter(skill => skill.status === 'mastered').length
    const inProgress = swimmer.skills.filter(skill => skill.status === 'in_progress').length
    const total = swimmer.skills.length
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0

    return { mastered, inProgress, total, percentage }
  }

  const getSkillsByLevel = () => {
    if (!swimmer?.skills) return {}

    return swimmer.skills.reduce((acc, skill) => {
      const levelId = skill.level.id
      if (!acc[levelId]) {
        acc[levelId] = {
          level: skill.level,
          skills: []
        }
      }
      acc[levelId].skills.push(skill)
      return acc
    }, {} as Record<string, { level: any; skills: any[] }>)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-300" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'Mastered'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Not Started'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Generate chart data for skills mastered over time
  const getSkillsOverTimeData = () => {
    if (!swimmer?.skills) return []

    const masteredSkills = swimmer.skills.filter(skill => skill.status === 'mastered' && skill.date_mastered)

    // Group by month
    const monthlyData: Record<string, number> = {}

    masteredSkills.forEach(skill => {
      if (skill.date_mastered) {
        const date = new Date(skill.date_mastered)
        const monthYear = format(date, 'MMM yyyy')
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1
      }
    })

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, skillsMastered: count }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
  }

  // Generate data for skill status distribution
  const getSkillStatusData = () => {
    if (!swimmer?.skills) return []

    const statusCounts = swimmer.skills.reduce((acc, skill) => {
      acc[skill.status] = (acc[skill.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { status: 'Mastered', count: statusCounts.mastered || 0, color: '#10b981' },
      { status: 'In Progress', count: statusCounts.in_progress || 0, color: '#f59e0b' },
      { status: 'Not Started', count: statusCounts.not_started || 0, color: '#9ca3af' }
    ]
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading swimmer details...</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  if (error || !swimmer) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Swimmer</h2>
            <p className="text-muted-foreground mb-4">{error || 'Swimmer not found'}</p>
            <Button onClick={() => router.push('/admin/swimmers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Swimmers
            </Button>
          </div>
        </div>
      </RoleGuard>
    )
  }

  const age = swimmer.date_of_birth ? calculateAge(swimmer.date_of_birth) : null

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/swimmers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {swimmer.first_name} {swimmer.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[swimmer.enrollment_status] || 'bg-gray-100'}>
                  {statusDisplayNames[swimmer.enrollment_status] || swimmer.enrollment_status}
                </Badge>
                <Badge className={paymentColors[swimmer.payment_type] || 'bg-gray-100'}>
                  {paymentDisplayNames[swimmer.payment_type] || swimmer.payment_type}
                </Badge>
                {age !== null && (
                  <Badge variant="outline">
                    {age} years old
                  </Badge>
                )}
                {swimmer.current_level && (
                  <Badge
                    variant="outline"
                    className="border-l-4"
                    style={{ borderLeftColor: swimmer.current_level.color || '#3b82f6' }}
                  >
                    {swimmer.current_level.display_name || swimmer.current_level.name}
                  </Badge>
                )}
                {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                  <>
                    {swimmer.diagnosis.map((d: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                        {d}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleUpdateInformation}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/swimmers/${swimmerId}/documents`)}>
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button onClick={() => router.push(`/admin/swimmers/${swimmerId}/progress`)}>
              <Activity className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medical">Medical & Safety</TabsTrigger>
            <TabsTrigger value="progress">Progress & Skills</TabsTrigger>
            <TabsTrigger value="sessions">Sessions & Bookings</TabsTrigger>
            <TabsTrigger value="billing">Billing & Funding</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Parent Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Parent/Guardian Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {swimmer.parent || swimmer.parent_id ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{swimmer.parent.full_name || 'Not provided'}</p>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" /> Parent Linked
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {swimmer.parent.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  <span>{swimmer.parent.email}</span>
                                </div>
                              )}
                              {swimmer.parent.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{swimmer.parent.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            if (swimmer.parent?.email) {
                              const subject = `I Can Swim - Regarding ${swimmer.first_name} ${swimmer.last_name}`
                              const body = `Dear ${swimmer.parent.full_name || 'Parent/Guardian'},\n\nI'm reaching out regarding ${swimmer.first_name} ${swimmer.last_name}.\n\nBest regards,\nThe I Can Swim Team`
                              window.location.href = `mailto:${swimmer.parent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                            } else {
                              toast({
                                title: "No Contact Information",
                                description: "This parent doesn't have an email address on file.",
                                variant: "destructive",
                              })
                            }
                          }}>
                            Contact
                          </Button>
                        </div>
                      </>
                    ) : swimmer.parent_email ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-amber-600">Pending Parent Signup</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>{swimmer.parent_email}</span>
                              </div>
                            </div>
                            <p className="text-xs text-amber-600 mt-2">
                              Parent has not created an account yet. They will be automatically linked when they sign up.
                            </p>
                            {swimmer.invited_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Invitation sent {formatInvitationTime(swimmer.invited_at)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {swimmer.invited_at ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleInviteParent}
                                disabled={invitingParent}
                              >
                                {invitingParent ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Resend Invite
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={handleInviteParent}
                                disabled={invitingParent}
                              >
                                {invitingParent ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <UserPlus className="h-4 w-4 mr-2" />
                                )}
                                Invite Parent
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">No parent information available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Add parent email to swimmer profile first"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Parent
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medical & Safety Summary */}
                {(swimmer.has_allergies || swimmer.has_medical_conditions || swimmer.history_of_seizures ||
                  swimmer.non_ambulatory || swimmer.self_injurious_behavior || swimmer.aggressive_behavior ||
                  swimmer.elopement_history || swimmer.restraint_history) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Medical & Safety Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {swimmer.has_allergies && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Allergies</p>
                            {swimmer.allergies_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.allergies_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.has_medical_conditions && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Medical Conditions</p>
                            {swimmer.medical_conditions_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.medical_conditions_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.history_of_seizures && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">History of Seizures</p>
                            <p className="text-sm text-muted-foreground">Requires special attention during lessons</p>
                          </div>
                        </div>
                      )}
                      {swimmer.non_ambulatory && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Non-Ambulatory</p>
                            <p className="text-sm text-muted-foreground">Requires wheelchair accessibility</p>
                          </div>
                        </div>
                      )}
                      {swimmer.self_injurious_behavior && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Self-Injurious Behavior</p>
                            {swimmer.self_injurious_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.self_injurious_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.aggressive_behavior && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Aggressive Behavior</p>
                            {swimmer.aggressive_behavior_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.aggressive_behavior_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.elopement_history && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Elopement History</p>
                            {swimmer.elopement_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.elopement_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.restraint_history && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Restraint History</p>
                            {swimmer.restraint_history_description && (
                              <p className="text-sm text-muted-foreground">{swimmer.restraint_history_description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Swimming Background */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Swimming Background & Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Previous Lessons</p>
                        <p className="font-medium">
                          {swimmer.previous_swim_lessons ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Comfort in Water</p>
                        <p className="font-medium capitalize">{swimmer.comfortable_in_water || 'Not specified'}</p>
                      </div>
                    </div>

                    {(swimmer.swim_goals || swimmer.swimGoals) && (swimmer.swim_goals || swimmer.swimGoals)!.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Swim Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {(swimmer.swim_goals || swimmer.swimGoals)!.map((goal, index) => (
                            <Badge key={index} variant="secondary">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Stats & Actions */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assessment Status</p>
                      <Badge
                        variant={swimmer.assessment_status === 'completed' ? 'default' : 'outline'}
                        className={swimmer.assessment_status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {swimmer.assessment_status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approval Status</p>
                      <Badge
                        variant={swimmer.approval_status === 'approved' ? 'default' : 'outline'}
                        className={swimmer.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                      >
                        {swimmer.approval_status === 'approved' ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Flexible Swimmer</p>
                      <Badge variant="outline">
                        {swimmer.flexible_swimmer ? 'Yes - Can fill last-minute spots' : 'No - Regular schedule only'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Legal Documents</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Waiver Signed</span>
                          {swimmer.signed_waiver ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Photo Release</span>
                          {swimmer.photo_release ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleBookSession}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleUpdateInformation}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Information
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleAddProgressNote}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Progress Note
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleSendToCoordinator}
                      disabled={swimmer?.payment_type !== 'funded' || !swimmer?.funding_coordinator_email}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send to Coordinator
                    </Button>

                    {/* Invite Parent - when no parent linked */}
                    {!swimmer.parent && swimmer.parent_email && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleInviteParent}
                        disabled={invitingParent}
                      >
                        {invitingParent ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : swimmer.invited_at ? (
                          <Mail className="h-4 w-4 mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {invitingParent ? 'Sending...' : swimmer.invited_at ? 'Resend Invite' : 'Invite Parent'}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* System Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{format(parseISO(swimmer.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{format(parseISO(swimmer.updated_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Swimmer ID</span>
                      <span className="font-mono text-xs">{swimmer.id.substring(0, 8)}...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Medical & Safety Tab */}
          <TabsContent value="medical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Height and Weight */}
                    {(swimmer.height || swimmer.weight) && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {swimmer.height && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Height</span>
                            <span className="text-muted-foreground">{swimmer.height}</span>
                          </div>
                        )}
                        {swimmer.weight && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Weight</span>
                            <span className="text-muted-foreground">{swimmer.weight}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Allergies */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.has_allergies ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {swimmer.has_allergies ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">-</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Allergies</span>
                          <Badge variant={swimmer.has_allergies ? "destructive" : "outline"} className={swimmer.has_allergies ? "" : "bg-gray-50 text-gray-700 border-gray-200"}>
                            {swimmer.has_allergies ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.has_allergies && swimmer.allergies_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Allergy Details</p>
                            <p className="text-red-700 text-sm">{swimmer.allergies_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Medical Conditions */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.has_medical_conditions ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {swimmer.has_medical_conditions ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">-</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Medical Conditions</span>
                          <Badge variant={swimmer.has_medical_conditions ? "destructive" : "outline"} className={swimmer.has_medical_conditions ? "" : "bg-gray-50 text-gray-700 border-gray-200"}>
                            {swimmer.has_medical_conditions ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.has_medical_conditions && swimmer.medical_conditions_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Condition Details</p>
                            <p className="text-red-700 text-sm">{swimmer.medical_conditions_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* History of Seizures */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.history_of_seizures ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.history_of_seizures ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">History of Seizures</span>
                          <Badge variant={swimmer.history_of_seizures ? "destructive" : "outline"} className={swimmer.history_of_seizures ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.history_of_seizures ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.history_of_seizures && swimmer.seizures_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Seizure Details</p>
                            <p className="text-red-700 text-sm">{swimmer.seizures_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Diagnosis */}
                    {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="font-medium mb-2">Diagnosis</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.diagnosis.map((d, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Safety & Mobility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety & Mobility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Toilet Trained */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.toilet_trained === 'yes' ? 'bg-green-100 text-green-600' : swimmer.toilet_trained === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                        {swimmer.toilet_trained === 'yes' ? (
                          <span className="text-xs font-bold">✓</span>
                        ) : swimmer.toilet_trained === 'in_progress' ? (
                          <span className="text-xs font-bold">↻</span>
                        ) : (
                          <span className="text-xs font-bold">✗</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Toilet Trained</span>
                          <Badge variant="outline" className={
                            swimmer.toiletTrained === 'yes' ? 'bg-green-50 text-green-700 border-green-200' :
                            swimmer.toiletTrained === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }>
                            {swimmer.toiletTrained === 'yes' ? 'Yes' : swimmer.toiletTrained === 'in_progress' ? 'In Progress' : swimmer.toiletTrained === 'no' ? 'No' : 'Not specified'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Non-Ambulatory */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.non_ambulatory ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.non_ambulatory ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Non-Ambulatory</span>
                          <Badge variant={swimmer.non_ambulatory ? "destructive" : "outline"} className={swimmer.non_ambulatory ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.non_ambulatory ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Self-Injurious Behavior */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.self_injurious_behavior ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.self_injurious_behavior ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Self-Injurious Behavior</span>
                          <Badge variant={swimmer.self_injurious_behavior ? "destructive" : "outline"} className={swimmer.self_injurious_behavior ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.self_injurious_behavior ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.self_injurious_behavior && swimmer.self_injurious_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Behavior Details</p>
                            <p className="text-red-700 text-sm">{swimmer.self_injurious_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aggressive Behavior */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.aggressive_behavior ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.aggressive_behavior ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Aggressive Behavior</span>
                          <Badge variant={swimmer.aggressive_behavior ? "destructive" : "outline"} className={swimmer.aggressive_behavior ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.aggressive_behavior ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.aggressive_behavior && swimmer.aggressive_behavior_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Behavior Details</p>
                            <p className="text-red-700 text-sm">{swimmer.aggressive_behavior_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Elopement History */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.elopement_history ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.elopement_history ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Elopement History</span>
                          <Badge variant={swimmer.elopement_history ? "destructive" : "outline"} className={swimmer.elopement_history ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.elopement_history ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.elopement_history && swimmer.elopement_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Elopement Details</p>
                            <p className="text-red-700 text-sm">{swimmer.elopement_description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Behavior Plan */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.has_behavior_plan ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                        {swimmer.has_behavior_plan ? (
                          <span className="text-xs font-bold">📋</span>
                        ) : (
                          <span className="text-xs font-bold">-</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Behavior Plan</span>
                          <Badge variant="outline" className={swimmer.has_behavior_plan ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                            {swimmer.has_behavior_plan ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Restraint History */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${swimmer.restraint_history ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {swimmer.restraint_history ? (
                          <span className="text-xs font-bold">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Restraint History</span>
                          <Badge variant={swimmer.restraint_history ? "destructive" : "outline"} className={swimmer.restraint_history ? "" : "bg-green-50 text-green-700 border-green-200"}>
                            {swimmer.restraint_history ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {swimmer.restraint_history && swimmer.restraint_history_description && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Restraint Details</p>
                            <p className="text-red-700 text-sm">{swimmer.restraint_history_description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress & Skills Tab */}
          <TabsContent value="progress" className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{getProgressStats().mastered}</div>
                    <div className="text-sm text-muted-foreground">Skills Mastered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">{getProgressStats().inProgress}</div>
                    <div className="text-sm text-muted-foreground">Skills In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{getProgressStats().total}</div>
                    <div className="text-sm text-muted-foreground">Total Skills</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Mastery</span>
                    <span className="font-medium">{getProgressStats().percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${getProgressStats().percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Mastered Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Skills Mastered Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getSkillsOverTimeData().length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getSkillsOverTimeData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="month"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [`${value} skills`, 'Mastered']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="skillsMastered"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No skills mastered yet</p>
                        <p className="text-sm">Skills mastery data will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skill Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Skill Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getSkillStatusData().some(item => item.count > 0) ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getSkillStatusData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="status"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [`${value} skills`, 'Count']}
                          />
                          <Bar
                            dataKey="count"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No skills data available</p>
                        <p className="text-sm">Skill tracking will begin after first lesson</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Level & Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Current Level & Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {swimmer.current_level ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{swimmer.current_level.display_name || swimmer.current_level.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {swimmer.current_level.description || 'No description available'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-l-4 text-lg px-4 py-2"
                        style={{ borderLeftColor: swimmer.current_level.color || '#3b82f6' }}
                      >
                        {swimmer.current_level.display_name || swimmer.current_level.name}
                      </Badge>
                    </div>

                    {/* Skills by Level */}
                    {Object.entries(getSkillsByLevel()).map(([levelId, { level, skills: levelSkills }]) => (
                      <div key={levelId} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: level.color || '#3b82f6' }}
                          />
                          <h4 className="font-medium">{level.display_name} Level</h4>
                          <Badge variant="outline" className="ml-auto">
                            {levelSkills.filter(s => s.status === 'mastered').length} of {levelSkills.length} mastered
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {levelSkills.map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(skill.status)}
                                <div>
                                  <div className="font-medium">{skill.name}</div>
                                  {skill.description && (
                                    <div className="text-sm text-muted-foreground">{skill.description}</div>
                                  )}
                                  {skill.date_mastered && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Mastered on {format(new Date(skill.date_mastered), 'MMM d, yyyy')}
                                    </div>
                                  )}
                                  {skill.instructor_notes && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Instructor notes: {skill.instructor_notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className={getStatusColor(skill.status)}>
                                {getStatusText(skill.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {swimmer.skills?.length === 0 && (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Skills Tracked Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Skills tracking will begin after the first lesson. Check back soon!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Level Assigned</h3>
                    <p className="text-muted-foreground mb-4">
                      This swimmer hasn't been assigned a swim level yet.
                    </p>
                    <Button>
                      <Award className="h-4 w-4 mr-2" />
                      Assign Level
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Progress Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Progress Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {swimmer.progress_notes && swimmer.progress_notes.length > 0 ? (
                    <>
                      {swimmer.progress_notes.slice(0, 5).map((note) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">
                                {note.session?.start_time
                                  ? format(new Date(note.session.start_time), 'MMM d, yyyy')
                                  : format(new Date(note.created_at), 'MMM d, yyyy')
                                }
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {note.instructor?.full_name && `with ${note.instructor.full_name}`}
                                {note.session?.location && ` • ${note.session.location}`}
                              </span>
                            </div>
                            {note.skills_mastered.length > 0 && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                {note.skills_mastered.length} skill{note.skills_mastered.length !== 1 ? 's' : ''} mastered
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-3">{note.lesson_summary}</p>
                          {note.instructor_notes && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                              <p className="text-xs font-medium text-blue-800 mb-1">Instructor Notes (Internal):</p>
                              <p className="text-sm text-blue-700">{note.instructor_notes}</p>
                            </div>
                          )}
                          {(note.skills_working_on.length > 0 || note.skills_mastered.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                              {note.skills_working_on.map((skillId, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  Working on: {skillId.substring(0, 8)}...
                                </Badge>
                              ))}
                              {note.skills_mastered.map((skillId, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                  Mastered: {skillId.substring(0, 8)}...
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {swimmer.progress_notes.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" onClick={() => router.push(`/admin/swimmers/${swimmerId}/progress-notes`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View All Progress Notes ({swimmer.progress_notes.length})
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Progress Notes Yet</h3>
                      <p className="text-muted-foreground">
                        Progress notes will appear here after each lesson. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Swim Goals */}
            {(swimmer.swim_goals || swimmer.swimGoals) && (swimmer.swim_goals || swimmer.swimGoals)!.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Swim Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(swimmer.swim_goals || swimmer.swimGoals)!.map((goal, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions & Bookings Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Session data would come from database - using placeholder */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Monday, Dec 23, 2024</h4>
                        <p className="text-sm text-muted-foreground">3:00 PM - 3:30 PM • Modesto Location</p>
                      </div>
                      <Badge variant="outline">Booked</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Instructor:</span>
                      <span>Sarah Johnson</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Monday, Dec 30, 2024</h4>
                        <p className="text-sm text-muted-foreground">3:00 PM - 3:30 PM • Modesto Location</p>
                      </div>
                      <Badge variant="outline">Booked</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Instructor:</span>
                      <span>Sarah Johnson</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-cyan-600">12</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">10</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">85%</div>
                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Session History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Session History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Dec 16, 2024</span>
                      <span className="text-sm text-muted-foreground ml-2">3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Completed</Badge>
                      <span className="text-sm text-muted-foreground">Sarah Johnson</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Dec 9, 2024</span>
                      <span className="text-sm text-muted-foreground ml-2">3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Completed</Badge>
                      <span className="text-sm text-muted-foreground">Sarah Johnson</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Dec 2, 2024</span>
                      <span className="text-sm text-muted-foreground ml-2">3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Completed</Badge>
                      <span className="text-sm text-muted-foreground">Mike Wilson</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium">Nov 25, 2024</span>
                      <span className="text-sm text-muted-foreground ml-2">3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-red-600">Cancelled</Badge>
                      <span className="text-sm text-muted-foreground">Parent request</span>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View Complete History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing & Funding Tab */}
          <TabsContent value="billing" className="space-y-6">
            {swimmer.funding_source_id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Funding Source Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Coordinator Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Regional Center Coordinator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="font-medium">{swimmer.funding_coordinator_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-medium">{swimmer.funding_coordinator_email || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="font-medium">{swimmer.funding_coordinator_phone || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* PO Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Current Purchase Order</h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                        <p className="font-medium">{swimmer.current_authorization_number || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expires</p>
                        <p className="font-medium">
                          {swimmer.authorization_expires_at
                            ? format(parseISO(swimmer.authorization_expires_at), 'MMM d, yyyy')
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Usage */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Session Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Sessions Used</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{swimmer.authorized_sessions_used || 0}</p>
                          <span className="text-muted-foreground">/ {swimmer.authorized_sessions_total || 0}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold">
                          {Math.max(0, (swimmer.authorized_sessions_total || 0) - (swimmer.authorized_sessions_used || 0))}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((swimmer.authorized_sessions_used || 0) / (swimmer.authorized_sessions_total || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{swimmer.authorized_sessions_used || 0} used</span>
                        <span>{swimmer.authorized_sessions_total || 0} authorized</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View PO Documents
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Coordinator
                      </Button>
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Request Renewal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Private Pay Billing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Private Pay Client</h3>
                    <p className="text-muted-foreground mb-6">
                      This swimmer is a private pay client. All billing is handled through Stripe.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button>
                        <DollarSign className="h-4 w-4 mr-2" />
                        View Payment History
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}

export default function AdminSwimmerDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AdminSwimmerDetailContent />
    </Suspense>
  )
}