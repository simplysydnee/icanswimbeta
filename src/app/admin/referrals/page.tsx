'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { emailService } from '@/lib/email-service'
import { format } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Search,
  Clock,
  AlertCircle,
  User,
  FileText,
  Users
} from 'lucide-react'

interface Referral {
  id: string
  parent_token: string
  status: string
  created_at: string
  coordinator_completed_at: string | null
  parent_completed_at: string | null

  // Child info
  child_name: string
  child_date_of_birth: string
  gender: string
  diagnosis: string[]
  height: string
  weight: string

  // Parent info
  parent_name: string
  parent_email: string
  parent_phone: string

  // Coordinator info
  coordinator_name: string
  coordinator_email: string
  coordinator_id?: string
  referral_type: string

  // Medical
  has_medical_conditions: boolean
  medical_conditions_description: string | null
  has_allergies: boolean
  allergies_description: string | null
  history_of_seizures: boolean
  toilet_trained: string
  non_ambulatory: boolean

  // Behavioral
  comfortable_in_water: boolean
  self_injurious_behavior: boolean
  self_injurious_behavior_description: string | null
  aggressive_behavior: boolean
  aggressive_behavior_description: string | null
  elopement_behavior: boolean
  elopement_behavior_description: string | null
  has_behavior_plan: boolean
  // Note: behavior_plan_description field doesn't exist in database
  // behavior_plan_description: string | null

  // Parent completion fields
  swim_goals: string[] | null
  availability: string[] | null
  preferred_start_date: string | null
  strengths_interests: string | null
  motivation_factors: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null

  // Signatures
  liability_waiver_signed: boolean
  cancellation_policy_signed: boolean
  photo_release_signed: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Referrals' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'awaiting_parent', label: 'Awaiting Parent' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
]

const getStatusBadge = (status: string, parentCompletedAt: string | null) => {
  // Helper function to check if parent_completed_at is a valid timestamp
  const isParentCompleted = (completedAt: string | null): boolean => {
    if (!completedAt) return false
    if (typeof completedAt === 'string' && completedAt.trim() === '') return false
    return true
  }

  const parentCompleted = isParentCompleted(parentCompletedAt)

  if (status === 'pending_parent' && !parentCompleted) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Awaiting Parent</Badge>
  }
  if ((status === 'pending_parent' && parentCompleted) || status === 'pending') {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Ready for Review</Badge>
  }
  if (status === 'approved') {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>
  }
  if (status === 'declined') {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Declined</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

function AdminReferralsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes in milliseconds for better freshness
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('filter') || 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeclineOpen, setIsDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Function to handle status filter changes and update URL
  const handleStatusFilterChange = useCallback((filter: string) => {
    setStatusFilter(filter)
    // Update URL with filter parameter
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])


  const fetchReferrals = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now()
    if (!forceRefresh && referrals.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using cached referrals, last fetched:', Math.round((now - lastFetchTime) / 1000), 'seconds ago')
      }
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('referral_requests')
        .select(`
          id,
          parent_token,
          status,
          created_at,
          coordinator_completed_at,
          parent_completed_at,
          child_name,
          child_date_of_birth,
          gender,
          diagnosis,
          height,
          weight,
          parent_name,
          parent_email,
          parent_phone,
          has_medical_conditions,
          medical_conditions_description,
          has_allergies,
          allergies_description,
          history_of_seizures,
          toilet_trained,
          non_ambulatory,
          comfortable_in_water,
          self_injurious_behavior,
          self_injurious_behavior_description,
          aggressive_behavior,
          aggressive_behavior_description,
          elopement_behavior,
          elopement_behavior_description,
          has_behavior_plan,
          swim_goals,
          availability,
          strengths_interests,
          coordinator_name,
          coordinator_email,
          referral_type,
          liability_waiver_signed,
          cancellation_policy_signed,
          photo_release_signed,
          preferred_start_date,
          motivation_factors,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Limit results for performance

      // If table doesn't exist yet, return empty array
      if (error) {
        console.error('Supabase error details:', error)

        if (typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string' &&
            error.message.includes('relation "public.referral_requests" does not exist')) {
          console.log('referral_requests table does not exist yet, returning empty referrals')
          setReferrals([])
          setLastFetchTime(now)
          setLoading(false)
          return
        }

        throw error
      }

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetched referrals:', data?.length || 0, 'records')
      }

      setReferrals(data || [])
      setLastFetchTime(now)
    } catch (err) {
      console.error('Error fetching referrals:', err)
      console.error('Error stringified:', JSON.stringify(err, null, 2))

      // Try to extract error message
      let errorMessage = 'Unknown error'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as Record<string, unknown>
        if (typeof errorObj.message === 'string') {
          errorMessage = errorObj.message
        } else if (typeof errorObj.details === 'string') {
          errorMessage = errorObj.details
        }
      }

      console.error('Extracted error message:', errorMessage)

      toast({
        title: 'Error',
        description: 'Failed to load referrals',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, referrals.length, lastFetchTime, CACHE_DURATION])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals]) // Only fetch once on mount

  // Helper function to check if parent has completed enrollment
  const isParentCompleted = (completedAt: string | null): boolean => {
    if (!completedAt) return false
    if (typeof completedAt === 'string' && completedAt.trim() === '') return false
    return true
  }

  const filteredReferrals = referrals.filter(r => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        r.child_name?.toLowerCase().includes(query) ||
        r.parent_name?.toLowerCase().includes(query) ||
        r.parent_email?.toLowerCase().includes(query) ||
        r.coordinator_name?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter === 'all') return true

    if (statusFilter === 'ready_for_review') {
      const completed = isParentCompleted(r.parent_completed_at)
      return (r.status === 'pending_parent' && completed) || r.status === 'pending'
    }

    if (statusFilter === 'awaiting_parent') {
      const completed = isParentCompleted(r.parent_completed_at)
      return r.status === 'pending_parent' && !completed
    }

    return r.status === statusFilter
  })

  const handleViewDetails = (referral: Referral) => {
    setSelectedReferral(referral)
    setIsDetailOpen(true)
  }

  const handleApprove = async (referral: Referral) => {
    setProcessing(true)
    try {
      // 1. Get parent's user ID if they have an account
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', referral.parent_email)
        .single()

      // 2. Create swimmer record
      const { data: swimmer, error: swimmerError } = await supabase
        .from('swimmers')
        .insert({
          parent_id: parentProfile?.id || null,
          first_name: referral.child_name.split(' ')[0],
          last_name: referral.child_name.split(' ').slice(1).join(' ') || '',
          date_of_birth: referral.child_date_of_birth,
          gender: referral.gender?.toLowerCase() || null,
          diagnosis: referral.diagnosis,
          height: referral.height,
          weight: referral.weight,

          // Medical
          has_medical_conditions: referral.has_medical_conditions,
          medical_conditions_description: referral.medical_conditions_description,
          has_allergies: referral.has_allergies,
          allergies_description: referral.allergies_description,
          history_of_seizures: referral.history_of_seizures,
          toilet_trained: referral.toilet_trained,
          non_ambulatory: referral.non_ambulatory,

          // Behavioral
          comfortable_in_water: referral.comfortable_in_water ? 'very' : 'not_at_all', // Convert boolean to text
          self_injurious_behavior: referral.self_injurious_behavior,
          self_injurious_behavior_description: referral.self_injurious_behavior_description,
          aggressive_behavior: referral.aggressive_behavior,
          aggressive_behavior_description: referral.aggressive_behavior_description,
          elopement_history: referral.elopement_behavior,
          elopement_history_description: referral.elopement_behavior_description,
          has_behavior_plan: referral.has_behavior_plan,
          // Note: behavior_plan_description field doesn't exist in database
          // behavior_plan_description: referral.behavior_plan_description,

          // From parent completion
          swim_goals: referral.swim_goals,
          availability: referral.availability, // Changed from availability_general to availability
          strengths_interests: referral.strengths_interests,

          // Funding source info - check if referral has funding_source_id
          payment_type: 'funding_source',
          coordinator_id: referral.coordinator_id,
          vmrc_coordinator_name: referral.coordinator_name,
          vmrc_coordinator_email: referral.coordinator_email,

          // Signatures - match swimmers table schema
          signed_waiver: referral.liability_waiver_signed, // Use signed_waiver instead of signed_liability
          signed_liability: referral.liability_waiver_signed,
          liability_waiver_signature: referral.liability_waiver_signed ? referral.parent_name : null,
          cancellation_policy_signature: referral.cancellation_policy_signed ? referral.parent_name : null,
          photo_video_permission: referral.photo_release_signed, // Use photo_video_permission instead of photo_release
          photo_video_signature: referral.photo_release_signed ? referral.parent_name : null,

          // Status
          enrollment_status: 'pending_assessment',
          assessment_status: 'not_scheduled',
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (swimmerError) throw swimmerError

      // 3. Update referral status
      const { error: updateError } = await supabase
        .from('referral_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          swimmer_id: swimmer.id,
        })
        .eq('id', referral.id)

      if (updateError) throw updateError

      // 4. Send approval email to parent
      const emailResult = await emailService.sendApprovalNotification({
        parentEmail: referral.parent_email,
        parentName: referral.parent_name,
        childName: referral.child_name,
      })

      if (emailResult.success) {
        toast({
          title: 'Referral Approved! ✅',
          description: `Swimmer record created and email sent to ${referral.parent_email}.`,
        })
      } else {
        toast({
          title: 'Referral Approved',
          description: 'Swimmer created. Email notification may be delayed.',
        })
      }

      setIsDetailOpen(false)
      fetchReferrals(true) // Force refresh after approval
    } catch (err) {
      console.error('Error approving referral:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))

      // Get better error message
      let errorMessage = 'Unknown error'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Try to extract error message from Supabase error
        const supabaseErr = err as { message?: string; details?: string; hint?: string }
        if (supabaseErr.message) {
          errorMessage = supabaseErr.message
        } else if (supabaseErr.details) {
          errorMessage = supabaseErr.details
        } else if (supabaseErr.hint) {
          errorMessage = supabaseErr.hint
        }
      }

      toast({
        title: 'Approval Failed',
        description: `Unable to approve referral: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedReferral || !declineReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for declining.',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('referral_requests')
        .update({
          status: 'declined',
          reviewed_at: new Date().toISOString(),
          decline_reason: declineReason,
        })
        .eq('id', selectedReferral.id)

      if (error) throw error

      // TODO: Send decline notification email

      toast({
        title: 'Referral Declined',
        description: `Referral for ${selectedReferral.child_name} has been declined.`,
      })

      setIsDeclineOpen(false)
      setIsDetailOpen(false)
      setDeclineReason('')
      fetchReferrals(true) // Force refresh after decline
    } catch (err) {
      console.error('Error declining referral:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      toast({
        title: 'Error',
        description: `Unable to decline referral: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const readyForReview = referrals.filter(r => {
    // Status is 'pending' (coordinator submitted, waiting for admin)
    if (r.status === 'pending') {
      return true
    }
    // Status is 'pending_parent' AND parent has completed enrollment
    if (r.status === 'pending_parent' && r.parent_completed_at) {
      // Additional check: make sure it's a valid timestamp string
      if (typeof r.parent_completed_at === 'string' && r.parent_completed_at.trim() !== '') {
        return true
      }
      // If it's not a string or is empty string, don't count it
      return false
    }
    return false
  }).length

  const awaitingParent = referrals.filter(r => {
    if (r.status !== 'pending_parent') return false
    // Check if parent_completed_at is null, undefined, or empty string
    if (!r.parent_completed_at) return true
    if (typeof r.parent_completed_at === 'string' && r.parent_completed_at.trim() === '') {
      return true
    }
    return false
  }).length

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-500">Review and approve enrollment referrals from all funding sources</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Ready for Review - Clickable */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'ready_for_review' ? 'ring-2 ring-[#2a5e84]' : ''
            }`}
            onClick={() => handleStatusFilterChange('ready_for_review')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ready for Review</p>
                  <p className="text-2xl font-bold text-blue-600">{readyForReview}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Awaiting Parent - Clickable */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'awaiting_parent' ? 'ring-2 ring-yellow-400' : ''
            }`}
            onClick={() => handleStatusFilterChange('awaiting_parent')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Awaiting Parent</p>
                  <p className="text-2xl font-bold text-yellow-600">{awaitingParent}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          {/* Approved - Clickable */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'approved' ? 'ring-2 ring-green-400' : ''
            }`}
            onClick={() => handleStatusFilterChange('approved')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {referrals.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Total - Clickable (shows all) */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'all' ? 'ring-2 ring-gray-400' : ''
            }`}
            onClick={() => handleStatusFilterChange('all')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-600">{referrals.length}</p>
                </div>
                <Users className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by child, parent, or coordinator name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusFilterChange('all')}
                  className="text-gray-500"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {statusFilter === 'all'
                  ? `All Referrals (${filteredReferrals.length})`
                  : `${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label} (${filteredReferrals.length})`
                }
              </CardTitle>
              {statusFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusFilterChange('all')}
                >
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No referrals found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.child_name}</p>
                          <p className="text-sm text-gray-500">
                            {referral.child_date_of_birth &&
                              format(new Date(referral.child_date_of_birth), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{referral.parent_name}</p>
                          <p className="text-sm text-gray-500">{referral.parent_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{referral.coordinator_name}</TableCell>
                      <TableCell>
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(referral.status, referral.parent_completed_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(referral)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Referral Details</DialogTitle>
              <DialogDescription>
                Review all information before approving
              </DialogDescription>
            </DialogHeader>

            {selectedReferral && (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedReferral.status, selectedReferral.parent_completed_at)}
                    {selectedReferral.status === 'pending_parent' &&
                     (!selectedReferral.parent_completed_at ||
                      (typeof selectedReferral.parent_completed_at === 'string' && selectedReferral.parent_completed_at.trim() === '')) && (
                      <span className="text-sm text-yellow-600">
                        Waiting for parent to complete their section
                      </span>
                    )}
                  </div>
                </div>

                {/* Child Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Child Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedReferral.child_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {selectedReferral.child_date_of_birth &&
                          format(new Date(selectedReferral.child_date_of_birth), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium">{selectedReferral.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Height / Weight</p>
                      <p className="font-medium">{selectedReferral.height} / {selectedReferral.weight}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Diagnosis</p>
                      <p className="font-medium">
                        {selectedReferral.diagnosis?.join(', ') || 'None specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Parent/Guardian
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedReferral.parent_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedReferral.parent_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{selectedReferral.parent_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Medical & Behavioral */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Medical & Safety
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Allergies</p>
                      <p className="font-medium">
                        {selectedReferral.has_allergies
                          ? selectedReferral.allergies_description
                          : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Medical Conditions</p>
                      <p className="font-medium">
                        {selectedReferral.has_medical_conditions
                          ? selectedReferral.medical_conditions_description
                          : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Seizure History</p>
                      <p className="font-medium">{selectedReferral.history_of_seizures ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Toilet Trained</p>
                      <p className="font-medium">{selectedReferral.toilet_trained}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Non-Ambulatory</p>
                      <p className="font-medium">{selectedReferral.non_ambulatory ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Comfortable in Water</p>
                      <p className="font-medium">{selectedReferral.comfortable_in_water ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Behavioral */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Behavioral Considerations</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Elopement Risk</p>
                      <p className="font-medium">
                        {selectedReferral.elopement_behavior
                          ? selectedReferral.elopement_behavior_description || 'Yes'
                          : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Self-Injurious Behavior</p>
                      <p className="font-medium">
                        {selectedReferral.self_injurious_behavior
                          ? selectedReferral.self_injurious_behavior_description || 'Yes'
                          : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Aggressive Behavior</p>
                      <p className="font-medium">
                        {selectedReferral.aggressive_behavior
                          ? selectedReferral.aggressive_behavior_description || 'Yes'
                          : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Behavior Plan</p>
                      <p className="font-medium">
                        {selectedReferral.has_behavior_plan ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parent Completed Section */}
                {selectedReferral.parent_completed_at &&
                 typeof selectedReferral.parent_completed_at === 'string' &&
                 selectedReferral.parent_completed_at.trim() !== '' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Parent Completed Section
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="col-span-2">
                          <p className="text-gray-500">Swim Goals</p>
                          <p className="font-medium">
                            {selectedReferral.swim_goals?.join(', ') || 'Not specified'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Availability</p>
                          <p className="font-medium">
                            {selectedReferral.availability?.join(', ') || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Preferred Start Date</p>
                          <p className="font-medium">
                            {selectedReferral.preferred_start_date
                              ? format(new Date(selectedReferral.preferred_start_date), 'MMMM d, yyyy')
                              : 'Flexible'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Strengths & Interests</p>
                          <p className="font-medium">{selectedReferral.strengths_interests || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Motivation Factors</p>
                          <p className="font-medium">{selectedReferral.motivation_factors || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Name</p>
                          <p className="font-medium">{selectedReferral.emergency_contact_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium">{selectedReferral.emergency_contact_phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Relationship</p>
                          <p className="font-medium">{selectedReferral.emergency_contact_relationship}</p>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Agreements Signed</h3>
                      <div className="flex gap-4">
                        <Badge variant={selectedReferral.liability_waiver_signed ? "default" : "outline"}
                               className={selectedReferral.liability_waiver_signed ? "bg-green-100 text-green-800" : ""}>
                          {selectedReferral.liability_waiver_signed ? '✓' : '✗'} Liability Waiver
                        </Badge>
                        <Badge variant={selectedReferral.cancellation_policy_signed ? "default" : "outline"}
                               className={selectedReferral.cancellation_policy_signed ? "bg-green-100 text-green-800" : ""}>
                          {selectedReferral.cancellation_policy_signed ? '✓' : '✗'} Cancellation Policy
                        </Badge>
                        <Badge variant={selectedReferral.photo_release_signed ? "default" : "outline"}
                               className={selectedReferral.photo_release_signed ? "bg-green-100 text-green-800" : ""}>
                          {selectedReferral.photo_release_signed ? '✓' : '✗'} Photo Release
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Coordinator Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Coordinator</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedReferral.coordinator_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedReferral.coordinator_email}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedReferral.status !== 'approved' && selectedReferral.status !== 'declined' && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeclineOpen(true)
                      }}
                      disabled={processing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedReferral)}
                      disabled={processing ||
                               !selectedReferral.parent_completed_at ||
                               (typeof selectedReferral.parent_completed_at === 'string' && selectedReferral.parent_completed_at.trim() === '')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve & Create Swimmer
                    </Button>
                  </div>
                )}

                {(!selectedReferral.parent_completed_at ||
                  (typeof selectedReferral.parent_completed_at === 'string' && selectedReferral.parent_completed_at.trim() === '')) &&
                 selectedReferral.status === 'pending_parent' && (
                  <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                    ⚠️ Cannot approve until parent completes their section.
                    <br />
                    <span className="text-xs">
                      Parent link: /enroll/complete/{selectedReferral.parent_token}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Decline Dialog */}
        <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Referral</DialogTitle>
              <DialogDescription>
                Please provide a reason for declining this referral.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="decline_reason">Reason for Declining *</Label>
                <Textarea
                  id="decline_reason"
                  placeholder="Enter the reason for declining this referral..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeclineOpen(false)
                    setDeclineReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={processing || !declineReason.trim()}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Confirm Decline
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}

export default function AdminReferralsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AdminReferralsContent />
    </Suspense>
  )
}