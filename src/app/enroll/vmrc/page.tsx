'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, User, Mail } from 'lucide-react';

// Form validation schema
const parentReferralSchema = z.object({
  parent_name: z.string().min(1, 'Your name is required'),
  parent_email: z.string().email('Valid email is required'),
  parent_phone: z.string().optional(),
  child_name: z.string().min(1, "Child's name is required"),
  child_date_of_birth: z.string().optional(),
  coordinator_name: z.string().min(1, 'Coordinator name is required'),
  coordinator_email: z.string().email('Valid coordinator email is required'),
});

type ParentReferralFormData = z.infer<typeof parentReferralSchema>;

function ParentVMRCReferralContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, profile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [childInfo, setChildInfo] = useState({
    firstName: '',
    lastName: '',
    dob: '',
  });

  // Read query params for child info
  useEffect(() => {
    const firstName = searchParams.get('firstName') || '';
    const lastName = searchParams.get('lastName') || '';
    const dob = searchParams.get('dob') || '';

    setChildInfo({ firstName, lastName, dob });
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParentReferralFormData>({
    resolver: zodResolver(parentReferralSchema),
  });

  // Auto-fill parent info if logged in
  useEffect(() => {
    if (profile && !authLoading) {
      setValue('parent_name', profile.full_name || '');
      setValue('parent_email', profile.email || '');
      // Note: phone field might not exist in profile, we'll need to check
    }
  }, [profile, authLoading, setValue]);

  // Set child info from query params
  useEffect(() => {
    if (childInfo.firstName && childInfo.lastName) {
      const fullName = `${childInfo.firstName} ${childInfo.lastName}`;
      setValue('child_name', fullName);
    }
    if (childInfo.dob) {
      setValue('child_date_of_birth', childInfo.dob);
    }
  }, [childInfo, setValue]);

  const onSubmit = async (data: ParentReferralFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      console.log('Submitting referral request:', data);
      const result = await apiClient.createParentReferralRequest(data);
      console.log('Referral request submitted successfully:', result);

      setSubmitResult({
        success: true,
        message: 'Referral request submitted successfully! Your coordinator will be in touch soon.',
      });
    } catch (error: any) {
      console.error('Error submitting referral request:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Error code:', error?.code);

      // Provide more detailed error message
      let errorMessage = 'Failed to submit referral request. Please try again or contact support.';
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      if (error.details) {
        errorMessage += ` Details: ${error.details}`;
      }
      if (error.hint) {
        errorMessage += ` Hint: ${error.hint}`;
      }

      setSubmitResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (submitResult?.success) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Request Submitted!</CardTitle>
            <CardDescription>
              Thank you for your interest in I Can Swim adaptive swim lessons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Your coordinator will receive your request</li>
                <li>They will complete the full VMRC referral form</li>
                <li>Our team will review the referral and contact you</li>
                <li>You'll be invited to schedule an assessment session</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container max-w-2xl py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const childFullName = childInfo.firstName && childInfo.lastName
    ? `${childInfo.firstName} ${childInfo.lastName}`
    : '';

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-[#2a5e84]">VMRC Referral Request</CardTitle>
          <CardDescription>
            Request a referral for adaptive swim lessons through your VMRC coordinator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitResult && !submitResult.success && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Child Information Summary */}
          {childFullName && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Enrolling Child</h3>
                  <p className="text-blue-700">
                    {childFullName}
                    {childInfo.dob && `, Date of Birth: ${formatDate(childInfo.dob)}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/enroll')}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Parent Information</h3>
                {user && (
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    Auto-filled from your account
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_name">Your Full Name *</Label>
                  <Input
                    id="parent_name"
                    {...register('parent_name')}
                    placeholder="Your full name"
                    readOnly={!!user}
                    className={user ? 'bg-gray-50' : ''}
                  />
                  {errors.parent_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.parent_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="parent_email">Your Email *</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    {...register('parent_email')}
                    placeholder="your@email.com"
                    readOnly={!!user}
                    className={user ? 'bg-gray-50' : ''}
                  />
                  {errors.parent_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.parent_email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="parent_phone">Your Phone (Optional)</Label>
                <Input
                  id="parent_phone"
                  {...register('parent_phone')}
                  placeholder="(209) 555-1234"
                />
              </div>

              {!user && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-800 text-sm">
                    Not logged in? Consider creating an account to save your information for future use.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Hidden child info fields (pre-filled from query params) */}
            <input type="hidden" {...register('child_name')} />
            <input type="hidden" {...register('child_date_of_birth')} />

            {/* Coordinator Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Coordinator Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coordinator_name">Coordinator Name *</Label>
                  <Input
                    id="coordinator_name"
                    {...register('coordinator_name')}
                    placeholder="Coordinator's full name"
                  />
                  {errors.coordinator_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.coordinator_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="coordinator_email">Coordinator Email *</Label>
                  <Input
                    id="coordinator_email"
                    type="email"
                    {...register('coordinator_email')}
                    placeholder="coordinator@example.com"
                  />
                  {errors.coordinator_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.coordinator_email.message}</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>This is the VMRC coordinator who will complete the full referral form.</p>
              </div>
            </div>

            {/* What to expect */}
            <div className="border rounded-lg p-4 bg-[#f0f7ff] border-[#2a5e84]/20">
              <h4 className="font-semibold text-[#2a5e84] mb-2">What to expect:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-[#2a5e84]">
                <li>Your coordinator will complete the full VMRC referral form</li>
                <li>Our team reviews all referrals within 2-3 business days</li>
                <li>You'll receive an invitation to schedule an assessment</li>
                <li>Assessment sessions are 30 minutes and help determine appropriate swim level</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2a5e84] hover:bg-[#1e4665] text-white py-3 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Referral Request
            </Button>
          </form>

          {/* Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p>Child Info: {JSON.stringify(childInfo)}</p>
              <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
              <p>Profile: {profile ? 'Loaded' : 'Not loaded'}</p>
              <p>Form values: {JSON.stringify(watch())}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParentVMRCReferralPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ParentVMRCReferralContent />
    </Suspense>
  );
}