'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Invitation {
  id: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export function PendingInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('parent_invitations')
        .select(`
          id,
          swimmer:swimmers(id, first_name, last_name)
        `)
        .eq('parent_email', user?.email?.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching invitations:', error);
        // Continue with empty invitations array
        setInvitations([]);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error in fetchInvitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (invitationId: string) => {
    setClaiming(invitationId);

    try {
      const response = await fetch('/api/invitations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: invitationId }),
      });

      if (response.ok) {
        // Refresh the page to show updated swimmers
        window.location.reload();
      }
    } catch (error) {
      console.error('Error claiming:', error);
    } finally {
      setClaiming(null);
    }
  };

  if (loading || invitations.length === 0) return null;

  return (
    <Card className="border-cyan-200 bg-cyan-50 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-600" />
          Swimmers Ready to Link
          <Badge className="bg-cyan-600">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          The following swimmers have been set up and are ready to be linked to your account.
        </p>
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="font-medium">
                {inv.swimmer.first_name} {inv.swimmer.last_name}
              </span>
              <Button
                size="sm"
                onClick={() => handleClaim(inv.id)}
                disabled={claiming === inv.id}
              >
                {claiming === inv.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Claim
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}