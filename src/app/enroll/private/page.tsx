'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedEnrollmentForm } from '@/components/enrollment';
import { getAllFundingSources } from '@/lib/funding-utils';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function PrivatePayEnrollmentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [privatePayFundingSourceId, setPrivatePayFundingSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load private pay funding source
  useEffect(() => {
    const loadPrivatePayFundingSource = async () => {
      try {
        const fundingSources = await getAllFundingSources();
        const privatePaySource = fundingSources.find(source => source.type === 'private_pay');
        if (privatePaySource) {
          setPrivatePayFundingSourceId(privatePaySource.id);
        } else {
          console.error('Private pay funding source not found');
        }
      } catch (error) {
        console.error('Error loading funding sources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrivatePayFundingSource();
  }, []);

  // Redirect if not logged in (handled by UnifiedEnrollmentForm)
  useEffect(() => {
    if (!authLoading && !user) {
      // Get child name from query params for personalized signup
      const searchParams = new URLSearchParams(window.location.search);
      const childFirstName = searchParams.get('firstName') || '';
      const childLastName = searchParams.get('lastName') || '';
      const childName = childFirstName && childLastName ? `${childFirstName} ${childLastName}` : '';

      const signupParams = new URLSearchParams({
        redirect: '/enroll/private'
      });
      if (childName) {
        signupParams.append('child', childName);
      }
      router.push(`/signup?${signupParams.toString()}`);
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-600" />
          <p className="mt-4 text-muted-foreground">Loading enrollment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-700 mb-2">
            Private Pay Enrollment
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete the enrollment form to register your child for private swimming lessons.
            All fields marked with * are required.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Enrollment Form</CardTitle>
            <CardDescription>
              Please complete all 7 sections of the enrollment form. Your progress will be saved as you go.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedEnrollmentForm
              preSelectedPaymentType="private_pay"
              preSelectedFundingSourceId={privatePayFundingSourceId || undefined}
              redirectTo="/parent/swimmers"
            />
          </CardContent>
        </Card>

        <Alert className="max-w-4xl mx-auto mt-6">
          <AlertDescription className="text-sm">
            <strong>Need help?</strong> Contact us at (555) 123-4567 or email support@icanswim.com
            if you have any questions about the enrollment process.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}