'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, CheckCircle, Target, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CompactQuickActionsProps {
  bookingId: string;
  sessionId: string;
  swimmerId: string;
  swimmerName: string;
  onSuccess?: () => void;
}

const QUICK_ACTIONS = [
  {
    id: 'great_session',
    title: 'Great',
    icon: ThumbsUp,
    color: 'bg-green-500 hover:bg-green-600',
    summary: 'Swimmer did great today! Focused well and made good progress.',
    mood: 'happy',
    waterComfort: 'comfortable',
    focusLevel: 'high'
  },
  {
    id: 'good_progress',
    title: 'Good',
    icon: CheckCircle,
    color: 'bg-blue-500 hover:bg-blue-600',
    summary: 'Made steady progress on skills. Good effort and participation.',
    mood: 'engaged',
    waterComfort: 'comfortable',
    focusLevel: 'medium'
  },
  {
    id: 'needs_work',
    title: 'Needs Work',
    icon: Target,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    summary: 'Some skills need more practice. Will focus on these next session.',
    mood: 'neutral',
    waterComfort: 'neutral',
    focusLevel: 'medium'
  },
  {
    id: 'absent',
    title: 'Absent',
    icon: Clock,
    color: 'bg-gray-500 hover:bg-gray-600',
    summary: 'Swimmer was absent today.',
    mood: 'neutral',
    waterComfort: 'neutral',
    focusLevel: 'low'
  }
];

export default function CompactQuickActions({
  bookingId,
  sessionId,
  swimmerId,
  swimmerName,
  onSuccess,
}: CompactQuickActionsProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    setSubmitting(action.id);

    try {
      const response = await fetch('/api/progress-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          bookingId,
          swimmerId,
          lessonSummary: action.summary,
          instructorNotes: '',
          parentNotes: '',
          skillsWorkingOn: [],
          skillsMastered: [],
          currentLevelId: null,
          sharedWithParent: false,
          attendanceStatus: action.id === 'absent' ? 'absent' : 'present',
          swimmerMood: action.mood,
          waterComfort: action.waterComfort,
          focusLevel: action.focusLevel,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Progress updated for ${swimmerName}`,
          variant: 'default',
        });
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update progress',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            size="sm"
            variant="ghost"
            className={cn(
              'h-7 px-2 text-xs',
              submitting === action.id && 'opacity-50'
            )}
            onClick={() => handleQuickAction(action)}
            disabled={submitting !== null}
            title={`Quick update: ${action.title}`}
          >
            {submitting === action.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3 w-3" />
            )}
            <span className="ml-1">{action.title}</span>
          </Button>
        );
      })}
    </div>
  );
}