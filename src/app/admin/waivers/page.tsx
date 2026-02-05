'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function WaiversAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch completion status
  const { data: stats, isLoading } = useQuery({
    queryKey: ['waiver-completion-status'],
    queryFn: async () => {
      const response = await fetch('/api/waivers/completion-status');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Send emails mutation
  const sendEmailsMutation = useMutation({
    mutationFn: async (parentIds?: string[]) => {
      const response = await fetch('/api/waivers/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentIds })
      });

      if (!response.ok) throw new Error('Failed to send emails');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Emails Sent Successfully',
        description: `Sent to ${data.emailsSent} parents${data.failed > 0 ? `, ${data.failed} failed` : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['waiver-completion-status'] });
    },
    onError: () => {
      toast({
        title: 'Failed to Send Emails',
        description: 'Please try again later',
        variant: 'destructive'
      });
    }
  });

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Waiver Update Management</h1>
          <p className="text-gray-600 mt-1">
            Manage waiver update campaigns and track completion status
          </p>
        </div>

        {/* Send Emails Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Send Waiver Update Emails</h2>
              <p className="text-sm text-gray-600">
                {stats?.needingWaivers || 0} parents have swimmers with incomplete waivers
              </p>
            </div>

            <Button
              onClick={() => {
                if (confirm(`Send waiver update emails to ${stats?.needingWaivers} parents?`)) {
                  sendEmailsMutation.mutate(undefined);
                }
              }}
              disabled={sendEmailsMutation.isPending || !stats?.needingWaivers}
            >
              {sendEmailsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send to All
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Completion Status Table */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Completion Status</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Swimmers</TableHead>
                  <TableHead>Complete / Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.parents?.map((parent: any) => (
                  <TableRow key={parent.id}>
                    <TableCell className="font-medium">{parent.name}</TableCell>
                    <TableCell>{parent.email}</TableCell>
                    <TableCell>{parent.swimmerCount}</TableCell>
                    <TableCell>
                      {parent.completeCount} / {parent.swimmerCount}
                    </TableCell>
                    <TableCell>
                      {parent.completeCount === parent.swimmerCount ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Incomplete
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {parent.emailSentAt
                        ? new Date(parent.emailSentAt).toLocaleDateString()
                        : 'Not sent'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendEmailsMutation.mutate([parent.id])}
                        disabled={sendEmailsMutation.isPending}
                      >
                        Resend
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </RoleGuard>
  );
}