'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import { LiabilityWaiverModal, CancellationPolicyModal } from '@/components/enrollment'
import { SWIM_GOALS, AVAILABILITY_SLOTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ReferralData {
  id: string
  child_name: string
  child_date_of_birth: string
  parent_name: string
  parent_email: string
  coordinator_name: string
  status: string
  parent_completed_at: string | null
}

export default function ParentCompletionPage() {
  const params = useParams()
  const token = params.token as string
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    swim_goals: [] as string[],
    availability: [] as string[],
    preferred_start_date: undefined as Date | undefined,
    strengths_interests: '',
    motivation_factors: '',
    liability_waiver_signed: false,
    liability_waiver_signature: '',
    cancellation_policy_signed: false,
    cancellation_policy_signature: '',
    photo_release_signed: false,
    photo_release_signature: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  })

  // Fetch referral by token
  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const { data, error } = await supabase
          .from('referral_requests')
          .select('id, child_name, child_date_of_birth, parent_name, parent_email, coordinator_name, status, parent_completed_at')
          .eq('parent_token', token)
          .single()

        if (error) throw error

        if (!data) {
          setError('Referral not found. Please check your link or contact support.')
          return
        }

        if (data.parent_completed_at) {
          setCompleted(true)
        }

        setReferral(data)
      } catch (err) {
        console.error('Error fetching referral:', err)
        setError('Unable to load referral. The link may be invalid or expired.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchReferral()
    }
  }, [token, supabase])

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      swim_goals: prev.swim_goals.includes(goal)
        ? prev.swim_goals.filter(g => g !== goal)
        : [...prev.swim_goals, goal]
    }))
  }

  const handleAvailabilityToggle = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(slot)
        ? prev.availability.filter(s => s !== slot)
        : [...prev.availability, slot]
    }))
  }

  const validateForm = (): boolean => {
    if (formData.swim_goals.length === 0) {
      toast({ title: 'Please select at least one swim goal', variant: 'destructive' })
      return false
    }
    if (formData.availability.length === 0) {
      toast({ title: 'Please select at least one availability option', variant: 'destructive' })
      return false
    }
    if (!formData.liability_waiver_signed) {
      toast({ title: 'Please agree to the liability waiver', variant: 'destructive' })
      return false
    }
    if (!formData.liability_waiver_signature.trim()) {
      toast({ title: 'Please sign the liability waiver', variant: 'destructive' })
      return false
    }
    if (!formData.cancellation_policy_signed) {
      toast({ title: 'Please agree to the cancellation policy', variant: 'destructive' })
      return false
    }
    if (!formData.cancellation_policy_signature.trim()) {
      toast({ title: 'Please sign the cancellation policy', variant: 'destructive' })
      return false
    }
    if (!formData.emergency_contact_name.trim()) {
      toast({ title: 'Please provide an emergency contact name', variant: 'destructive' })
      return false
    }
    if (!formData.emergency_contact_phone.trim()) {
      toast({ title: 'Please provide an emergency contact phone', variant: 'destructive' })
      return false
    }
    return true
  }


  const handleSubmit = async () => {
    if (!validateForm() || !referral) return

    setSubmitting(true)
    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('referral_requests')
        .update({
          swim_goals: formData.swim_goals,
          availability: formData.availability,
          preferred_start_date: formData.preferred_start_date?.toISOString().split('T')[0],
          strengths_interests: formData.strengths_interests,
          motivation_factors: formData.motivation_factors,
          liability_waiver_signed: formData.liability_waiver_signed,
          liability_waiver_signature: formData.liability_waiver_signature,
          liability_waiver_signed_at: now,
          cancellation_policy_signed: formData.cancellation_policy_signed,
          cancellation_policy_signature: formData.cancellation_policy_signature,
          cancellation_policy_signed_at: now,
          photo_release_signed: formData.photo_release_signed,
          photo_release_signature: formData.photo_release_signature || null,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
          parent_completed_at: now,
          status: 'pending_parent', // Ready for admin review
        })
        .eq('parent_token', token)

      if (error) throw error

      setCompleted(true)
      toast({
        title: '✅ Enrollment Submitted!',
        description: `Thank you! We've received ${referral.child_name}'s enrollment information.`,
      })
    } catch (err) {
      console.error('Error submitting:', err)
      toast({
        title: 'Submission failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84] mx-auto" />
          <p className="mt-2 text-gray-600">Loading your enrollment...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Contact us: (209) 778-7877 or info@icanswim209.com
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already completed state
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Enrollment Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you! We&apos;ve received {referral?.child_name}&apos;s enrollment information.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Our team will review your enrollment</li>
                <li>• Once approved, you&apos;ll receive an email to schedule {referral?.child_name}&apos;s swim assessment</li>
                <li>• Your coordinator ({referral?.coordinator_name}) will be updated</li>
              </ul>
              <p className="text-gray-600 mt-3">
                This usually takes 2-3 business days.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => window.location.href = '/parent-home'}>
                Go to Parent Dashboard
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Questions? Call (209) 778-7877
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2a5e84]">Complete Your Enrollment</h1>
          <p className="text-gray-600 mt-2">
            Almost done! Please complete the information below for {referral?.child_name}.
          </p>
        </div>

        {/* Child Info Summary (Read-only) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Referral Information</CardTitle>
            <CardDescription>Submitted by your funding source coordinator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Child&apos;s Name</p>
                <p className="font-medium">{referral?.child_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {referral?.child_date_of_birth
                    ? format(new Date(referral.child_date_of_birth), 'MMMM d, yyyy')
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Parent/Guardian</p>
                <p className="font-medium">{referral?.parent_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Coordinator</p>
                <p className="font-medium">{referral?.coordinator_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swim Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Swim Goals *</CardTitle>
            <CardDescription>Select all goals that apply for your child</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SWIM_GOALS.map((goal) => (
                <div
                  key={goal}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.swim_goals.includes(goal)
                      ? "border-[#2a5e84] bg-[#2a5e84]/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleGoalToggle(goal)}
                >
                  <Checkbox
                    checked={formData.swim_goals.includes(goal)}
                    onCheckedChange={() => handleGoalToggle(goal)}
                  />
                  <span className="text-sm">{goal}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Motivation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">About Your Child</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="strengths">Strengths & Interests</Label>
              <Textarea
                id="strengths"
                data-testid="strengths-input"
                placeholder="What does your child enjoy? What are they good at?"
                value={formData.strengths_interests}
                onChange={(e) => setFormData({ ...formData, strengths_interests: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="motivation">What Motivates Your Child?</Label>
              <Textarea
                id="motivation"
                data-testid="motivation-input"
                placeholder="Praise, stickers, songs, specific toys, etc."
                value={formData.motivation_factors}
                onChange={(e) => setFormData({ ...formData, motivation_factors: e.target.value })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Availability *</CardTitle>
            <CardDescription>When can your child attend lessons?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABILITY_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.availability.includes(slot)
                      ? "border-[#2a5e84] bg-[#2a5e84]/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleAvailabilityToggle(slot)}
                >
                  <Checkbox
                    checked={formData.availability.includes(slot)}
                    onCheckedChange={() => handleAvailabilityToggle(slot)}
                  />
                  <span className="text-sm">{slot}</span>
                </div>
              ))}
            </div>

            {/* Preferred Start Date */}
            <div className="mt-4">
              <Label>Preferred Start Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.preferred_start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.preferred_start_date
                      ? format(formData.preferred_start_date, 'PPP')
                      : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.preferred_start_date}
                    onSelect={(date) => setFormData({ ...formData, preferred_start_date: date })}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Agreements & Signatures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Agreements & Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Liability Waiver */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="liability"
                  data-testid="liability-checkbox"
                  checked={formData.liability_waiver_signed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, liability_waiver_signed: checked === true })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="liability" className="font-medium">
                    Liability Waiver Agreement *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    I have read and agree to the <LiabilityWaiverModal />
                  </p>
                </div>
              </div>
              {formData.liability_waiver_signed && (
                <div className="ml-6 pt-2 border-t">
                  <Label htmlFor="liability_sig" className="text-sm">Signature *</Label>
                  <Input
                    id="liability_sig"
                    data-testid="liability-signature"
                    placeholder="Type your full legal name"
                    value={formData.liability_waiver_signature}
                    onChange={(e) => setFormData({ ...formData, liability_waiver_signature: e.target.value })}
                    className="mt-1 max-w-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    By typing your name, you are electronically signing this waiver.
                  </p>
                </div>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="cancellation"
                  data-testid="cancellation-checkbox"
                  checked={formData.cancellation_policy_signed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cancellation_policy_signed: checked === true })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="cancellation" className="font-medium">
                    Cancellation Policy Agreement *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    I have read and agree to the <CancellationPolicyModal />
                  </p>
                </div>
              </div>
              {formData.cancellation_policy_signed && (
                <div className="ml-6 pt-2 border-t">
                  <Label htmlFor="cancel_sig" className="text-sm">Signature *</Label>
                  <Input
                    id="cancel_sig"
                    data-testid="cancellation-signature"
                    placeholder="Type your full legal name"
                    value={formData.cancellation_policy_signature}
                    onChange={(e) => setFormData({ ...formData, cancellation_policy_signature: e.target.value })}
                    className="mt-1 max-w-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    By typing your name, you are electronically signing this agreement.
                  </p>
                </div>
              )}
            </div>

            {/* Photo Release (Optional) */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="photo"
                  data-testid="photo-checkbox"
                  checked={formData.photo_release_signed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, photo_release_signed: checked === true })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="photo" className="font-medium">
                    Photo/Video Release (Optional)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    I grant permission for I Can Swim to use photos/videos of my child for promotional materials, website, and social media.
                  </p>
                </div>
              </div>
              {formData.photo_release_signed && (
                <div className="ml-6 pt-2 border-t">
                  <Label htmlFor="photo_sig" className="text-sm">Signature (Optional)</Label>
                  <Input
                    id="photo_sig"
                    data-testid="photo-signature"
                    placeholder="Type your full legal name"
                    value={formData.photo_release_signature}
                    onChange={(e) => setFormData({ ...formData, photo_release_signature: e.target.value })}
                    className="mt-1 max-w-sm"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact *</CardTitle>
            <CardDescription>Someone we can reach if we can&apos;t reach you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ec_name">Contact Name *</Label>
                <Input
                  id="ec_name"
                  data-testid="emergency-name"
                  placeholder="Full name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ec_phone">Contact Phone *</Label>
                <Input
                  id="ec_phone"
                  data-testid="emergency-phone"
                  type="tel"
                  placeholder="(209) 555-1234"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="ec_rel">Relationship to Child</Label>
                <Input
                  id="ec_rel"
                  data-testid="emergency-relationship"
                  placeholder="e.g., Grandmother, Uncle, Family Friend"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            data-testid="submit-button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#2a5e84] hover:bg-[#1e4a6d] text-white px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete Enrollment'
            )}
          </Button>
        </div>

        {/* Contact Info */}
        <p className="text-center text-sm text-gray-500 mt-6" data-testid="contact-footer">
          Questions? Contact us at (209) 778-7877 or info@icanswim209.com
        </p>
      </div>
    </div>
  )
}