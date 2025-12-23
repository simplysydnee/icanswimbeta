'use client'

import { useEffect, useState } from 'react'
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
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  Loader2
} from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { format, parseISO, differenceInYears } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

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
    description?: string
    color?: string
  }
  // Medical info
  has_allergies: boolean
  allergies_description?: string
  has_medical_conditions: boolean
  medical_conditions_description?: string
  diagnosis?: string[]
  history_of_seizures: boolean
  toilet_trained?: boolean
  non_ambulatory: boolean
  // Behavioral info
  self_injurious_behavior: boolean
  self_injurious_description?: string
  aggressive_behavior: boolean
  aggressive_behavior_description?: string
  elopement_history: boolean
  elopement_description?: string
  // Swimming background
  previous_swim_lessons: boolean
  comfortable_in_water: string
  swim_goals?: string[]
  flexible_swimmer: boolean
  // Funding source info
  payment_type: string
  funding_source_id?: string
  funding_coordinator_name?: string
  funding_coordinator_email?: string
  funding_coordinator_phone?: string
  authorized_sessions_used?: number
  authorized_sessions_total?: number
  current_authorization_number?: string
  authorization_expires_at?: string
  // Legal
  signed_waiver: boolean
  photo_release: boolean
  // Parent info
  parent?: {
    id: string
    full_name?: string
    email?: string
    phone?: string
  }
  // Timestamps
  created_at: string
  updated_at: string
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

export default function AdminSwimmerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const swimmerId = params.id as string
  const defaultTab = searchParams.get('tab') || 'overview'

  const [swimmer, setSwimmer] = useState<Swimmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSwimmerData()
  }, [swimmerId])

  const fetchSwimmerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('swimmers')
        .select(`
          *,
          parent:profiles!swimmers_parent_id_fkey(id, full_name, email, phone),
          current_level:swim_levels(*)
        `)
        .eq('id', swimmerId)
        .single()

      if (fetchError) throw fetchError

      setSwimmer(data)
    } catch (err) {
      console.error('Error fetching swimmer:', err)
      setError('Failed to load swimmer details')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAssessment = () => {
    router.push(`/admin/booking?tab=assessment&swimmer=${swimmerId}`)
  }

  const handleUpdateInformation = () => {
    router.push(`/admin/swimmers/${swimmerId}/edit`)
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
    if (!swimmer) return

    if (swimmer.payment_type === 'funded' && swimmer.funding_coordinator_email) {
      const subject = encodeURIComponent(`Re: ${swimmer.first_name} ${swimmer.last_name} - I Can Swim`)
      const body = encodeURIComponent(`Hi ${swimmer.funding_coordinator_name || 'Coordinator'},\n\nRegarding ${swimmer.first_name} ${swimmer.last_name}:\n\n• Current Level: ${swimmer.current_level?.display_name || 'Not assigned'}\n• Assessment Status: ${swimmer.assessment_status}\n• Sessions Used: ${swimmer.authorized_sessions_used || 0}/${swimmer.authorized_sessions_total || 0}\n\nPlease let me know if you need any additional information.\n\nBest regards,\nI Can Swim Team`)
      window.open(`mailto:${swimmer.funding_coordinator_email}?subject=${subject}&body=${body}`)
    } else {
      toast({
        title: "No Coordinator Email",
        description: "This swimmer doesn't have a coordinator assigned or is not a funded client.",
        variant: "destructive",
      })
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth))
    } catch {
      return null
    }
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    {swimmer.parent ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{swimmer.parent.full_name || 'Not provided'}</p>
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
                          <Button variant="outline" size="sm">
                            Contact
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No parent information available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Medical & Safety Summary */}
                {(swimmer.has_allergies || swimmer.has_medical_conditions || swimmer.history_of_seizures) && (
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
                    <div className="grid grid-cols-2 gap-4">
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

                    {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Swim Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.swim_goals.map((goal, index) => (
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
                      onClick={handleBookAssessment}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Assessment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleUpdateInformation}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Information
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Allergies</span>
                      <Badge variant={swimmer.has_allergies ? "destructive" : "outline"}>
                        {swimmer.has_allergies ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {swimmer.has_allergies && swimmer.allergies_description && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="font-medium text-amber-800 mb-1">Allergy Details</p>
                        <p className="text-amber-700">{swimmer.allergies_description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Medical Conditions</span>
                      <Badge variant={swimmer.has_medical_conditions ? "destructive" : "outline"}>
                        {swimmer.has_medical_conditions ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {swimmer.has_medical_conditions && swimmer.medical_conditions_description && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="font-medium text-red-800 mb-1">Condition Details</p>
                        <p className="text-red-700">{swimmer.medical_conditions_description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-medium">History of Seizures</span>
                      <Badge variant={swimmer.history_of_seizures ? "destructive" : "outline"}>
                        {swimmer.history_of_seizures ? 'Yes' : 'No'}
                      </Badge>
                    </div>

                    {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Diagnosis</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.diagnosis.map((d, i) => (
                            <Badge key={i} variant="secondary">
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
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Toilet Trained</span>
                      <Badge variant={swimmer.toilet_trained ? "default" : "outline"}>
                        {swimmer.toilet_trained === true ? 'Yes' : swimmer.toilet_trained === false ? 'No' : 'Not specified'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Non-Ambulatory</span>
                      <Badge variant={swimmer.non_ambulatory ? "destructive" : "outline"}>
                        {swimmer.non_ambulatory ? 'Yes' : 'No'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Self-Injurious Behavior</span>
                      <Badge variant={swimmer.self_injurious_behavior ? "destructive" : "outline"}>
                        {swimmer.self_injurious_behavior ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {swimmer.self_injurious_behavior && swimmer.self_injurious_description && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="font-medium text-red-800 mb-1">Behavior Details</p>
                        <p className="text-red-700">{swimmer.self_injurious_description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Aggressive Behavior</span>
                      <Badge variant={swimmer.aggressive_behavior ? "destructive" : "outline"}>
                        {swimmer.aggressive_behavior ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {swimmer.aggressive_behavior && swimmer.aggressive_behavior_description && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="font-medium text-red-800 mb-1">Behavior Details</p>
                        <p className="text-red-700">{swimmer.aggressive_behavior_description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Elopement History</span>
                      <Badge variant={swimmer.elopement_history ? "destructive" : "outline"}>
                        {swimmer.elopement_history ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {swimmer.elopement_history && swimmer.elopement_description && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="font-medium text-red-800 mb-1">Elopement Details</p>
                        <p className="text-red-700">{swimmer.elopement_description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress & Skills Tab */}
          <TabsContent value="progress" className="space-y-6">
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

                    {/* Skills Checklist */}
                    <div>
                      <h4 className="font-medium mb-3">Skills in this Level</h4>
                      <div className="space-y-2">
                        {/* These would come from the database - using placeholder for now */}
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500"></div>
                          <span>Water entry and exit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500"></div>
                          <span>Blowing bubbles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                          <span>Front float with support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                          <span>Back float with support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                          <span>Kicking with board</span>
                        </div>
                      </div>
                    </div>
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
                  {/* Progress note would come from database - using placeholder */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">Session on Dec 15, 2024</span>
                        <span className="text-sm text-muted-foreground ml-2">with Instructor Sarah</span>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                    <p className="text-sm mb-3">
                      Made great progress with blowing bubbles today. Still working on front float but showing improvement.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Bubbles</Badge>
                      <Badge variant="secondary" className="text-xs">Water Comfort</Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">Session on Dec 8, 2024</span>
                        <span className="text-sm text-muted-foreground ml-2">with Instructor Mike</span>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                    <p className="text-sm mb-3">
                      First assessment completed. Swimmer is comfortable entering water but needs work on floating.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Assessment</Badge>
                      <Badge variant="secondary" className="text-xs">Water Entry</Badge>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View All Progress Notes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Swim Goals */}
            {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Swim Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {swimmer.swim_goals.map((goal, index) => (
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
                        <p className="text-sm text-muted-foreground">3:00 PM - 3:30 PM • Turlock Location</p>
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
                        <p className="text-sm text-muted-foreground">3:00 PM - 3:30 PM • Turlock Location</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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