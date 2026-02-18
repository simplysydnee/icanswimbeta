'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, Phone, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmailMismatchErrorProps {
  invitedEmail: string;
  currentEmail: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function EmailMismatchError({
  invitedEmail,
  currentEmail,
  contactEmail = 'sutton@icanswim209.com',
  contactPhone = '209-985-1538'
}: EmailMismatchErrorProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(`/login?message=signed-out-for-invitation&email=${encodeURIComponent(invitedEmail)}`);
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Email Mismatch</CardTitle>
          <CardDescription>
            The invitation was sent to a different email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTitle>Email addresses don't match</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div>
                  <span className="font-medium">Invitation sent to:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-mono text-sm">{invitedEmail}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">You're signed in as:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-mono text-sm">{currentEmail}</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How to fix this:</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To claim this swimmer, you need to use the email address that received the invitation.
              </p>
            </div>

            {/* Option 1: Sign out and use invited email */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <LogOut className="h-4 w-4 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Use the invited email</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign out and create a new account with <span className="font-medium">{invitedEmail}</span>
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full"
              >
                {isSigningOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign Out and Continue
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You'll be redirected to create an account with the correct email
              </p>
            </div>

            {/* Option 2: Contact admin */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Phone className="h-4 w-4 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Request an updated invitation</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact I Can Swim to have the invitation sent to your current email
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={`mailto:${contactEmail}?subject=Parent Invitation Email Mismatch&body=Hello, I need help claiming an invitation for my swimmer. The invitation was sent to ${invitedEmail} but I'm using ${currentEmail}. Please resend the invitation to ${currentEmail}.`}>
                    Send Email to I Can Swim
                  </a>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={`tel:${contactPhone.replace(/\D/g, '')}`}>
                    Call I Can Swim
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {contactEmail} • {contactPhone}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Why this happens:</strong> Each invitation is tied to a specific email address for security. This ensures swimmers are connected to the correct parent account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
