'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, User, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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
  };
}

export default function ClaimSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleClaim = async () => {
    if (!invitation || !user) return;

    // Check if email matches
    if (user.email?.toLowerCase() !== invitation.parent_email.toLowerCase()) {
      setError(`Please sign in with ${invitation.parent_email} to claim this swimmer`);
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch(`/api/invitations/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim invitation');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/parent');
      }, 2000);
    } catch (error) {
      console.error('Error claiming:', error);
      setError(error instanceof Error ? error.message : 'Failed to claim swimmer');
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

          <Button
            onClick={handleClaim}
            disabled={claiming || user.email?.toLowerCase() !== invitation?.parent_email.toLowerCase()}
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