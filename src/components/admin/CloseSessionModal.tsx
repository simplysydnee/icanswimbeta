'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface CloseSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    start_time: string;
    instructor_name: string | null;
    location: string | null;
    bookings_count?: number;
  };
  onSuccess?: () => void;
}

type CloseReason = 'pool_closed' | 'instructor_unavailable' | 'other';

export function CloseSessionModal({
  open,
  onOpenChange,
  session,
  onSuccess,
}: CloseSessionModalProps) {
  const { toast } = useToast();
  const [closeReason, setCloseReason] = useState<CloseReason>('pool_closed');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!closeReason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for closing the session.',
        variant: 'destructive',
      });
      return;
    }

    if (closeReason === 'other' && !notes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide additional notes when selecting "Other".',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/sessions/${session.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          close_reason: closeReason,
          close_reason_notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close session');
      }

      toast({
        title: 'Success',
        description: data.message || 'Session closed successfully.',
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close session.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSessionTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const reasonLabels: Record<CloseReason, string> = {
    pool_closed: 'Pool Closed',
    instructor_unavailable: 'Instructor Unavailable',
    other: 'Other',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close Session</DialogTitle>
          <DialogDescription>
            Close this session and cancel all existing bookings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session details */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-medium">
              {formatSessionTime(session.start_time)}
            </div>
            {session.instructor_name && (
              <div>Instructor: {session.instructor_name}</div>
            )}
            {session.location && <div>Location: {session.location}</div>}
            {session.bookings_count !== undefined && (
              <div className="font-medium text-destructive">
                {session.bookings_count} booking(s) will be cancelled
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Warning:</strong> This will cancel all existing bookings
              for this session. Parents will need to rebook for a different
              session.
            </div>
          </div>

          {/* Close reason */}
          <div className="space-y-2">
            <Label htmlFor="close-reason">Close Reason *</Label>
            <Select
              value={closeReason}
              onValueChange={(value) => setCloseReason(value as CloseReason)}
            >
              <SelectTrigger id="close-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pool_closed">
                  {reasonLabels.pool_closed}
                </SelectItem>
                <SelectItem value="instructor_unavailable">
                  {reasonLabels.instructor_unavailable}
                </SelectItem>
                <SelectItem value="other">{reasonLabels.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes{' '}
              {closeReason === 'other' && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                closeReason === 'other'
                  ? 'Please provide details about why this session is being closed...'
                  : 'Optional additional details...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            {closeReason === 'other' && (
              <p className="text-sm text-muted-foreground">
                Required when selecting "Other"
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Closing...' : 'Close Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}