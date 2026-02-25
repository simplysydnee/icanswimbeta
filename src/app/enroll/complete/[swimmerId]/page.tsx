'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { SWIM_GOALS, AVAILABILITY_SLOTS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// We'll create a simplified enrollment form for updating existing swimmers
// This is different from the UnifiedEnrollmentForm which creates new swimmers

interface SwimmerData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_id: string;
  enrollment_status: string;
  approval_status: string;

  // Medical Information
  has_allergies?: boolean;
  allergies_description?: string;
  has_medical_conditions?: boolean;
  medical_conditions_description?: string;
  diagnosis?: string[];
  history_of_seizures?: boolean;
  toilet_trained?: boolean;
  non_ambulatory?: boolean;

  // Behavioral Information
  self_injurious_behavior?: boolean;
  self_injurious_description?: string;
  aggressive_behavior?: boolean;
  aggressive_behavior_description?: string;
  elopement_history?: boolean;
  elopement_description?: string;
  has_behavior_plan?: boolean;

  // Swimming Background
  previous_swim_lessons?: boolean;
  previous_swim_experience?: string;
  comfortable_in_water?: boolean;
  swim_goals?: string[];

  // Scheduling
  availability_slots?: string[];
  other_availability?: string;
  flexible_swimmer?: boolean;

  // Consent & Agreements (these will be handled separately via waiver flow)
  signed_liability?: boolean;
  cancellation_policy_signature?: boolean;
  photo_release?: boolean;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export default function CompleteEnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const swimmerId = params.swimmerId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swimmer, setSwimmer] = useState<SwimmerData | null>(null);

  // Form state - simplified for completion
  const [formData, setFormData] = useState({
    // Medical Information
    has_allergies: undefined as boolean | undefined,
    allergies_description: '',
    has_medical_conditions: undefined as boolean | undefined,
    medical_conditions_description: '',
    diagnosis: [] as string[],
    history_of_seizures: undefined as boolean | undefined,
    toilet_trained: undefined as boolean | undefined,
    non_ambulatory: undefined as boolean | undefined,

    // Behavioral Information
    self_injurious_behavior: undefined as boolean | undefined,
    self_injurious_description: '',
    aggressive_behavior: undefined as boolean | undefined,
    aggressive_behavior_description: '',
    elopement_history: undefined as boolean | undefined,
    elopement_description: '',
    has_behavior_plan: undefined as boolean | undefined,

    // Swimming Background
    previous_swim_lessons: undefined as boolean | undefined,
    previous_swim_experience: '',
    comfortable_in_water: undefined as boolean | undefined,
    swim_goals: [] as string[],

    // Scheduling
    availability_slots: [] as string[],
    other_availability: '',
    flexible_swimmer: false,

    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  // Fetch swimmer data and verify ownership
  useEffect(() => {
    const fetchSwimmerAndVerify = async () => {
      if (!swimmerId || authLoading) return;

      try {
        // Check if user is authenticated
        if (!user) {
          setError('You must be logged in to complete enrollment.');
          setLoading(false);
          return;
        }

        // Fetch swimmer data with all necessary fields
        const { data: swimmerData, error: swimmerError } = await supabase
          .from('swimmers')
          .select(`
            *,
            parent:profiles(id, full_name, email, phone)
          `)
          .eq('id', swimmerId)
          .single();

        if (swimmerError) {
          console.error('Error fetching swimmer:', swimmerError);
          setError('Swimmer not found. Please check the link or contact support.');
          setLoading(false);
          return;
        }

        // Verify the logged-in user is the parent of this swimmer
        if (swimmerData.parent_id !== user.id) {
          setError('You do not have permission to complete enrollment for this swimmer.');
          setLoading(false);
          return;
        }

        // Check if enrollment is already completed
        if (swimmerData.enrollment_status !== 'pending_enrollment') {
          if (swimmerData.enrollment_status === 'pending_approval') {
            setError('Enrollment has already been submitted and is pending approval.');
          } else if (swimmerData.enrollment_status === 'enrolled') {
            setError('Swimmer is already enrolled.');
          } else {
            setError('Enrollment has already been completed for this swimmer.');
          }
          setLoading(false);
          return;
        }

        setSwimmer(swimmerData);

        // Pre-populate form with existing data
        setFormData({
          // Medical Information
          has_allergies: swimmerData.has_allergies,
          allergies_description: swimmerData.allergies_description || '',
          has_medical_conditions: swimmerData.has_medical_conditions,
          medical_conditions_description: swimmerData.medical_conditions_description || '',
          diagnosis: swimmerData.diagnosis || [],
          history_of_seizures: swimmerData.history_of_seizures,
          toilet_trained: swimmerData.toilet_trained,
          non_ambulatory: swimmerData.non_ambulatory,

          // Behavioral Information
          self_injurious_behavior: swimmerData.self_injurious_behavior,
          self_injurious_description: swimmerData.self_injurious_description || '',
          aggressive_behavior: swimmerData.aggressive_behavior,
          aggressive_behavior_description: swimmerData.aggressive_behavior_description || '',
          elopement_history: swimmerData.elopement_history,
          elopement_description: swimmerData.elopement_description || '',
          has_behavior_plan: swimmerData.has_behavior_plan,

          // Swimming Background
          previous_swim_lessons: swimmerData.previous_swim_lessons,
          previous_swim_experience: swimmerData.previous_swim_experience || '',
          comfortable_in_water: swimmerData.comfortable_in_water,
          swim_goals: swimmerData.swim_goals || [],

          // Scheduling
          availability_slots: swimmerData.availability_slots || [],
          other_availability: swimmerData.other_availability || '',
          flexible_swimmer: swimmerData.flexible_swimmer || false,

          // Emergency Contact
          emergency_contact_name: swimmerData.emergency_contact_name || '',
          emergency_contact_phone: swimmerData.emergency_contact_phone || '',
          emergency_contact_relationship: swimmerData.emergency_contact_relationship || '',
        });

      } catch (err) {
        console.error('Error in fetchSwimmerAndVerify:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSwimmerAndVerify();
  }, [swimmerId, user, authLoading, supabase]);

  const validateForm = (): boolean => {
    // Basic validation - in a real implementation, you would have more comprehensive validation
    if (!formData.emergency_contact_name.trim()) {
      toast({ title: 'Please provide an emergency contact name', variant: 'destructive' });
      return false;
    }
    if (!formData.emergency_contact_phone.trim()) {
      toast({ title: 'Please provide an emergency contact phone', variant: 'destructive' });
      return false;
    }
    if (formData.swim_goals.length === 0) {
      toast({ title: 'Please select at least one swim goal', variant: 'destructive' });
      return false;
    }
    if (formData.availability_slots.length === 0) {
      toast({ title: 'Please select at least one availability option', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      swim_goals: prev.swim_goals.includes(goal)
        ? prev.swim_goals.filter(g => g !== goal)
        : [...prev.swim_goals, goal]
    }));
  };

  const handleAvailabilityToggle = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availability_slots: prev.availability_slots.includes(slot)
        ? prev.availability_slots.filter(s => s !== slot)
        : [...prev.availability_slots, slot]
    }));
  };

  const handleSubmit = async () => {
    if (!swimmer || !user) return;

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Update the swimmer record with completed enrollment information
      const { error: updateError } = await supabase
        .from('swimmers')
        .update({
          // Medical Information
          has_allergies: formData.has_allergies,
          allergies_description: formData.allergies_description || null,
          has_medical_conditions: formData.has_medical_conditions,
          medical_conditions_description: formData.medical_conditions_description || null,
          diagnosis: formData.diagnosis,
          history_of_seizures: formData.history_of_seizures,
          toilet_trained: formData.toilet_trained,
          non_ambulatory: formData.non_ambulatory,

          // Behavioral Information
          self_injurious_behavior: formData.self_injurious_behavior,
          self_injurious_description: formData.self_injurious_description || null,
          aggressive_behavior: formData.aggressive_behavior,
          aggressive_behavior_description: formData.aggressive_behavior_description || null,
          elopement_history: formData.elopement_history,
          elopement_description: formData.elopement_description || null,
          has_behavior_plan: formData.has_behavior_plan,

          // Swimming Background
          previous_swim_lessons: formData.previous_swim_lessons,
          previous_swim_experience: formData.previous_swim_experience || null,
          comfortable_in_water: formData.comfortable_in_water,
          swim_goals: formData.swim_goals,

          // Scheduling
          availability_slots: formData.availability_slots,
          other_availability: formData.other_availability || null,
          flexible_swimmer: formData.flexible_swimmer,

          // Emergency Contact
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,

          // Update enrollment status
          enrollment_status: 'pending_approval',
          approval_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', swimmerId)
        .eq('parent_id', user.id); // Double-check ownership

      if (updateError) {
        throw updateError;
      }

      // Success!
      setCompleted(true);
      toast({
        title: '✅ Enrollment Submitted!',
        description: `Thank you! We've received ${swimmer.first_name}'s enrollment information.`,
      });

    } catch (err) {
      console.error('Error submitting enrollment:', err);
      toast({
        title: 'Submission failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84] mx-auto" />
          <p className="mt-2 text-gray-600">Loading enrollment form...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Complete Enrollment</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/parent')}>
              Go to Parent Dashboard
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Contact us: (209) 778-7877 or info@icanswim209.com
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already completed state
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-700 mb-2">Enrollment Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you! We've received {swimmer?.first_name}'s enrollment information.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Our team will review your enrollment</li>
                <li>• Once approved, you'll receive an email notification</li>
                <li>• You can then schedule {swimmer?.first_name}'s swim assessment</li>
              </ul>
              <p className="text-gray-600 mt-3">
                This usually takes 2-3 business days.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => router.push('/parent')}>
                Go to Parent Dashboard
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Questions? Call (209) 778-7877
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form - simplified for demo
  // In a real implementation, you would create proper form components
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2a5e84]">Complete Enrollment for {swimmer?.first_name} {swimmer?.last_name}</h1>
          <p className="text-gray-600 mt-2">
            Please complete the remaining enrollment information for {swimmer?.first_name}.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Some basic information has already been provided. Please fill in the remaining details below.
          </AlertDescription>
        </Alert>

        {/* Swim Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Swim Goals *</CardTitle>
            <CardDescription>Select all goals that apply for {swimmer?.first_name}</CardDescription>
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

        {/* Availability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Availability *</CardTitle>
            <CardDescription>When can {swimmer?.first_name} attend lessons?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABILITY_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.availability_slots.includes(slot)
                      ? "border-[#2a5e84] bg-[#2a5e84]/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleAvailabilityToggle(slot)}
                >
                  <Checkbox
                    checked={formData.availability_slots.includes(slot)}
                    onCheckedChange={() => handleAvailabilityToggle(slot)}
                  />
                  <span className="text-sm">{slot}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact *</CardTitle>
            <CardDescription>Someone we can reach if we can't reach you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ec_name">Contact Name *</Label>
                <Input
                  id="ec_name"
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
                  placeholder="e.g., Grandmother, Uncle, Family Friend"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
            <CardDescription>Tell us more about {swimmer?.first_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="previous_experience">Previous Swim Experience</Label>
              <Textarea
                id="previous_experience"
                placeholder="Has your child had swim lessons before? Where? For how long?"
                value={formData.previous_swim_experience}
                onChange={(e) => setFormData({ ...formData, previous_swim_experience: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="other_availability">Other Availability Notes</Label>
              <Textarea
                id="other_availability"
                placeholder="Any other scheduling notes or constraints?"
                value={formData.other_availability}
                onChange={(e) => setFormData({ ...formData, other_availability: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            Waivers and consent forms will be handled separately after enrollment submission.
            You will be prompted to complete them once your enrollment is approved.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
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
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at (209) 778-7877 or info@icanswim209.com
        </p>
      </div>
    </div>
  );
}