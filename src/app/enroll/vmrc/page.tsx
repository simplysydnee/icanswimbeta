'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Form validation schema
const parentReferralSchema = z.object({
  parent_name: z.string().min(1, 'Your name is required'),
  parent_email: z.string().email('Valid email is required'),
  child_name: z.string().min(1, "Child's name is required"),
  child_date_of_birth: z.string().optional(),
  coordinator_name: z.string().min(1, 'Coordinator name is required'),
  coordinator_email: z.string().email('Valid coordinator email is required'),
});

type ParentReferralFormData = z.infer<typeof parentReferralSchema>;

export default function ParentVMRCReferralPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentReferralFormData>({
    resolver: zodResolver(parentReferralSchema),
  });

  const onSubmit = async (data: ParentReferralFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await apiClient.createParentReferralRequest(data);
      setSubmitResult({
        success: true,
        message: 'Referral request submitted successfully! Your coordinator will be in touch soon.',
      });
    } catch (error) {
      console.error('Error submitting referral request:', error);
      setSubmitResult({
        success: false,
        message: 'Failed to submit referral request. Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">VMRC Referral Request</CardTitle>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_name">Your Full Name *</Label>
                  <Input
                    id="parent_name"
                    {...register('parent_name')}
                    placeholder="Your full name"
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
                  />
                  {errors.parent_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.parent_email.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Child Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="child_name">Child's Full Name *</Label>
                  <Input
                    id="child_name"
                    {...register('child_name')}
                    placeholder="Child's full name"
                  />
                  {errors.child_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.child_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="child_date_of_birth">Date of Birth (Optional)</Label>
                  <Input
                    id="child_date_of_birth"
                    type="date"
                    {...register('child_date_of_birth')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Coordinator Information</h3>
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
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-2">What to expect:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>Your coordinator will complete the full VMRC referral form</li>
                <li>Our team reviews all referrals within 2-3 business days</li>
                <li>You'll receive an invitation to schedule an assessment</li>
                <li>Assessment sessions are 45 minutes and help determine appropriate swim level</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Referral Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}