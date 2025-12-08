'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DraftSession } from '@/hooks/useDraftSessions';
import { useUpdateSession } from '@/hooks';
import { EditSessionDialog } from './EditSessionDialog';

interface SessionRowProps {
  session: DraftSession;
  selected: boolean;
  onSelect: (sessionId: string, selected: boolean) => void;
}

export function SessionRow({ session, selected, onSelect }: SessionRowProps) {
  const { toast } = useToast();
  const { mutate: updateSession, isPending: isUpdating } = useUpdateSession();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calculateDuration = () => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return `${durationMinutes} min`;
  };

  const handleSave = async (updates: {
    start_time?: string;
    end_time?: string;
    instructor_id?: string;
  }) => {
    updateSession(
      { sessionId: session.id, data: updates },
      {
        onSuccess: () => {
          toast({
            title: 'Session updated',
            description: 'Session has been updated successfully.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Update failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(session.id, checked === true)}
          aria-label={`Select session on ${formatDate(session.start_time)} at ${formatTime(session.start_time)}`}
        />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="space-y-1">
            <div className="font-medium">{formatDate(session.start_time)}</div>
            <div className="text-sm text-muted-foreground">
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Duration</div>
            <Badge variant="outline" className="font-normal">
              {calculateDuration()}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Type</div>
            <div className="text-sm capitalize">{session.session_type}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Capacity</div>
            <div className="text-sm">
              {session.booking_count}/{session.max_capacity}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={isUpdating}
              className="h-8 w-8 p-0"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              <span className="sr-only">Edit session</span>
            </Button>
          </div>
        </div>
      </div>

      <EditSessionDialog
        session={session}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}