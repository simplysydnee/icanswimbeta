'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, User, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { EmailMismatchError } from '@/components/claim/EmailMismatchError';

interface Invitation {
  id: string;
  parent_email: string;
  parent_name: string | null;
  status: string;
  expires_at: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
}

type ClaimError =
  | { type: 'EMAIL_MISMATCH'; message: string; invitedEmail: string; currentEmail: string; contactEmail?: string; contactPhone?: string; }
  | { type: 'EXPIRED' | 'DOB_MISMATCH' | 'INVALID_TOKEN' | 'ALREADY_CLAIMED' | 'NETWORK_ERROR' | 'OTHER'; message: string }
  | string
  | null;

export default function ClaimSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<ClaimError>(null);
  const [success, setSuccess] = useState(false);
  const [dobInput, setDobInput] = useState('');
  const [dobError, setDobError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invitations/claim/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid invitation link');
        return;
      }

      const invitationData = data.invitation;
      if (!invitationData) {
        setError('Invitation not found');
      } else if (invitationData.is_claimed) {
        setError('This invitation has already been claimed');
      } else if (invitationData.is_expired) {
        setError('This invitation has expired');
      } else {
        setInvitation(invitationData);
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Invalid invitation link');
    } finally {
      setLoading(false);
    }
  };

  const validateDob = (input: string, expectedDob: string): boolean => {
    if (!input.trim()) {
      setDobError('Date of birth is required');
      return false;
    }

    // Normalize expected DOB from database (YYYY-MM-DD)
    const expectedDate = new Date(expectedDob);
    if (isNaN(expectedDate.getTime())) {
      console.error('Invalid expected DOB format:', expectedDob);
      setDobError('System error: invalid swimmer date of birth');
      return false;
    }

    // Try parsing input in various formats
    const parsedDate = new Date(input);
    if (isNaN(parsedDate.getTime())) {
      setDobError('Invalid date format. Please use MM/DD/YYYY or YYYY-MM-DD');
      return false;
    }

    // Compare year, month, day
    if (
      parsedDate.getFullYear() !== expectedDate.getFullYear() ||
      parsedDate.getMonth() !== expectedDate.getMonth() ||
      parsedDate.getDate() !== expectedDate.getDate()
    ) {
      setDobError('Date of birth does not match our records. Please try again.');
      return false;
    }

    setDobError(null);
    return true;
  };

  const handleClaim = async () => {
    if (!invitation || !user) return;

    // Check if email matches - show detailed error if mismatch
    if (user.email?.toLowerCase() !== invitation.parent_email.toLowerCase()) {
      setError({
        type: 'EMAIL_MISMATCH',
        message: `This invitation was sent to ${invitation.parent_email}, but you are currently signed in as ${user.email}.`,
        invitedEmail: invitation.parent_email,
        currentEmail: user.email || '',
        contactEmail: 'sutton@icanswim209.com',
        contactPhone: '209-985-1538'
      });
      return;
    }

    // Validate date of birth
    if (!validateDob(dobInput, invitation.swimmer.date_of_birth)) {
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch(`/api/invitations/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: dobInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle EMAIL_MISMATCH specifically
        if (data.error === 'EMAIL_MISMATCH') {
          setError({
            type: 'EMAIL_MISMATCH',
            message: data.message,
            invitedEmail: data.invitedEmail,
            currentEmail: data.currentEmail,
            contactEmail: data.resolutionOptions?.[1]?.contactEmail || 'sutton@icanswim209.com',
            contactPhone: data.resolutionOptions?.[1]?.contactPhone || '209-985-1538'
          });
          return;
        }

        // Handle other known errors
        if (data.error === 'EXPIRED' || data.error === 'DOB_MISMATCH' ||
            data.error === 'INVALID_TOKEN' || data.error === 'ALREADY_CLAIMED') {
          setError({
            type: data.error,
            message: data.message
          });
          return;
        }

        // Generic error
        setError(data.message || data.error || 'Failed to claim invitation');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/parent');
      }, 2000);
    } catch (error) {
      console.error('Error claiming:', error);
      setError({
        type: 'NETWORK_ERROR',
        message: 'Failed to claim invitation. Please check your connection and try again.'
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error) {
    // Handle EMAIL_MISMATCH error with special component
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'EMAIL_MISMATCH') {
      const emailError = error as Extract<ClaimError, { type: 'EMAIL_MISMATCH' }>;
      try {
        return (
          <EmailMismatchError
            invitedEmail={emailError.invitedEmail}
            currentEmail={emailError.currentEmail}
            contactEmail={emailError.contactEmail || 'sutton@icanswim209.com'}
            contactPhone={emailError.contactPhone || '209-985-1538'}
          />
        );
      } catch (componentError) {
        console.error('EmailMismatchError component failed:', componentError);
        // Fallback to simple error display
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Email Mismatch</h2>
                <p className="text-muted-foreground mb-4">{emailError.message}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please contact I Can Swim at sutton@icanswim209.com or 209-985-1538
                </p>
                <Link href="/login">
                  <Button>Go to Login</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        );
      }
    }

    // Handle other error objects
    if (typeof error === 'object' && error !== null && 'type' in error) {
      const err = error as Extract<ClaimError, { type: string }>;
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to Claim</h2>
              <p className="text-muted-foreground mb-4">{err.message}</p>
              <Link href="/login">
                <Button>Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle string errors (backward compatibility)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Claim</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-muted-foreground mb-4">
              {invitation?.swimmer.first_name} has been linked to your account.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Claim Your Swimmer</CardTitle>
            <CardDescription>
              You've been invited to manage {invitation?.swimmer.first_name} {invitation?.swimmer.last_name}'s swim lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-cyan-50 rounded-lg text-center">
              <User className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
              <p className="font-medium">{invitation?.swimmer.first_name} {invitation?.swimmer.last_name}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Invitation sent to:</p>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {invitation?.parent_email}
              </p>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Please sign in or create an account with the email above to claim this swimmer.
            </p>

            <div className="flex gap-2">
              <Link href={`/login?redirect=/claim/${token}`} className="flex-1">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href={`/signup?email=${encodeURIComponent(invitation?.parent_email || '')}&redirect=/claim/${token}`} className="flex-1">
                <Button variant="outline" className="w-full">Create Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Claim Your Swimmer</CardTitle>
          <CardDescription>
            Link {invitation?.swimmer.first_name} to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-cyan-50 rounded-lg text-center">
            <User className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
            <p className="font-medium text-lg">{invitation?.swimmer.first_name} {invitation?.swimmer.last_name}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Signed in as:</p>
            <p className="font-medium">{user.email}</p>
          </div>

          {user.email?.toLowerCase() !== invitation?.parent_email.toLowerCase() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p>This invitation was sent to <strong>{invitation?.parent_email}</strong>.</p>
              <p className="mt-1">Please sign in with that email to claim this swimmer.</p>
            </div>
          )}

          {/* Date of Birth Verification */}
          <div className="space-y-2">
            <Label htmlFor="dob">Verify Swimmer's Date of Birth *</Label>
            <Input
              id="dob"
              type="text"
              placeholder="MM/DD/YYYY or YYYY-MM-DD"
              value={dobInput}
              onChange={(e) => {
                setDobInput(e.target.value);
                if (dobError) setDobError(null);
              }}
              className={dobError ? 'border-red-500' : ''}
            />
            {dobError && (
              <p className="text-sm text-red-600">{dobError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter {invitation?.swimmer.first_name}'s date of birth as it appears in our records.
            </p>
          </div>

          <Button
            onClick={handleClaim}
            disabled={claiming || user.email?.toLowerCase() !== invitation?.parent_email.toLowerCase() || !dobInput.trim()}
            className="w-full"
          >
            {claiming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Claim Swimmer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}