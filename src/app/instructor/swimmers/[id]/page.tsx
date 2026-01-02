'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  Heart,
  BookOpen,
  ShieldX
} from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { format, parseISO, differenceInYears } from 'date-fns'
import { useSwimmerAccess } from '@/hooks/useSwimmerAccess'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  photo_url?: string
  enrollment_status: string
  assessment_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
  // Medical info
  has_allergies: boolean
  allergies_description?: string
  has_medical_conditions: boolean
  medical_conditions_description?: string
  diagnosis?: string[]
  history_of_seizures: boolean
  // Swimming background
  previous_swim_lessons: boolean
  comfortable_in_water: string
  swim_goals?: string[]
  // Funding source info
  payment_type: string
  funding_source_id?: string
  funding_coordinator_name?: string
  authorized_sessions_used?: number
  authorized_sessions_total?: number
  // Parent info
  parent?: {
    id: string
    full_name?: string
    email?: string
    phone?: string
  }
}

// Status badge colors
const statusColors: Record<string, string> = {
  enrolled: "bg-green-100 text-green-800 border-green-200",
  waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
}

// Payment type colors
const paymentColors: Record<string, string> = {
  private_pay: "bg-blue-100 text-blue-800 border-blue-200",
  funded: "bg-purple-100 text-purple-800 border-purple-200",
  scholarship: "bg-orange-100 text-orange-800 border-orange-200",
}

export default function InstructorSwimmerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const swimmerId = params.id as string

  const [swimmer, setSwimmer] = useState<Swimmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if instructor has access to this swimmer
  const { data: hasAccess, isLoading: checkingAccess } = useSwimmerAccess(swimmerId)

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
          current_level:swim_levels(*),
          funding_source:funding_source_id(id, name, short_name, type)
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

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth))
    } catch {
      return null
    }
  }

  // Show loading while checking access or fetching data
  if (checkingAccess || loading) {
    return (
      <RoleGuard allowedRoles={['instructor', 'admin']}>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                {checkingAccess ? 'Checking access...' : 'Loading swimmer details...'}
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  // Check if instructor has access to this swimmer
  if (hasAccess === false) {
    return (
      <RoleGuard allowedRoles={['instructor', 'admin']}>
        <div className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center h-64">
            <ShieldX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
            <p className="text-gray-500">
              You don't have access to this swimmer's information.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Access is granted when you have upcoming or recent sessions with this swimmer.
            </p>
            <Button onClick={() => router.push('/instructor/swimmers')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Swimmers
            </Button>
          </div>
        </div>
      </RoleGuard>
    )
  }

  if (error || !swimmer) {
    return (
      <RoleGuard allowedRoles={['instructor', 'admin']}>
        <div className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Swimmer</h2>
            <p className="text-muted-foreground mb-4">{error || 'Swimmer not found'}</p>
            <Button onClick={() => router.push('/instructor/swimmers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Swimmers
            </Button>
          </div>
        </div>
      </RoleGuard>
    )
  }

  const age = swimmer.date_of_birth ? calculateAge(swimmer.date_of_birth) : null

  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/instructor/swimmers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {swimmer.first_name} {swimmer.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[swimmer.enrollment_status] || 'bg-gray-100'}>
                  {swimmer.enrollment_status === 'enrolled' ? 'Enrolled' :
                   swimmer.enrollment_status === 'waitlist' ? 'Waitlist' :
                   swimmer.enrollment_status}
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
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medical">Medical & Safety</TabsTrigger>
            <TabsTrigger value="progress">Progress & Skills</TabsTrigger>
            <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
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
                    {swimmer.funding_source_id && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{swimmer.funding_source?.[0]?.name || 'Funding Source'} Sessions</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold">{swimmer.authorized_sessions_used || 0}</span>
                          <span className="text-muted-foreground">/ {swimmer.authorized_sessions_total || 0}</span>
                          <span className="text-sm text-muted-foreground">used</span>
                        </div>
                        {swimmer.authorized_sessions_total &&
                         swimmer.authorized_sessions_used &&
                         swimmer.authorized_sessions_used >= swimmer.authorized_sessions_total - 2 && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Renewal needed soon
                          </div>
                        )}
                      </div>
                    )}
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
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      Add Progress Note
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Make-up
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Parent
                    </Button>
                    {swimmer.funding_source_id && (
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Request PO Renewal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Medical & Safety Tab */}
          <TabsContent value="medical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Medical & Safety Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Allergies */}
                <div>
                  <h3 className="font-semibold mb-2">Allergies</h3>
                  <div className="flex items-center justify-between">
                    <span>Has Allergies</span>
                    <Badge variant={swimmer.has_allergies ? "destructive" : "outline"}>
                      {swimmer.has_allergies ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {swimmer.has_allergies && swimmer.allergies_description && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="font-medium text-amber-800">Allergy Details:</p>
                      <p className="text-amber-700">{swimmer.allergies_description}</p>
                    </div>
                  )}
                </div>

                {/* Medical Conditions */}
                <div>
                  <h3 className="font-semibold mb-2">Medical Conditions</h3>
                  <div className="flex items-center justify-between">
                    <span>Has Medical Conditions</span>
                    <Badge variant={swimmer.has_medical_conditions ? "destructive" : "outline"}>
                      {swimmer.has_medical_conditions ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {swimmer.has_medical_conditions && swimmer.medical_conditions_description && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium text-red-800">Condition Details:</p>
                      <p className="text-red-700">{swimmer.medical_conditions_description}</p>
                    </div>
                  )}
                </div>

                {/* Seizures */}
                <div>
                  <h3 className="font-semibold mb-2">Seizure History</h3>
                  <div className="flex items-center justify-between">
                    <span>History of Seizures</span>
                    <Badge variant={swimmer.history_of_seizures ? "destructive" : "outline"}>
                      {swimmer.history_of_seizures ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {swimmer.history_of_seizures && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium text-red-800">⚠️ Important Safety Note:</p>
                      <p className="text-red-700">This swimmer has a history of seizures. Be prepared to respond appropriately during lessons.</p>
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Diagnosis</h3>
                    <div className="flex flex-wrap gap-2">
                      {swimmer.diagnosis.map((d, i) => (
                        <Badge key={i} variant="secondary">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress & Skills Tab - Placeholder */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress & Skills Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-muted-foreground mb-6">
                    View and track swimmer progress, skills mastered, and add progress notes.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button>
                      <Activity className="h-4 w-4 mr-2" />
                      View Progress History
                    </Button>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Add Progress Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Sessions Tab - Placeholder */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Session Schedule</h3>
                  <p className="text-muted-foreground mb-6">
                    View upcoming sessions, attendance, and booking history for this swimmer.
                  </p>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Session Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}