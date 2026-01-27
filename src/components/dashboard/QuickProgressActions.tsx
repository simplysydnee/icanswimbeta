'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ThumbsUp, Target, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickProgressAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  summary: string;
  mood: string;
  waterComfort: string;
  focusLevel: string;
}

interface QuickProgressActionsProps {
  bookingId: string;
  sessionId: string;
  swimmerId: string;
  swimmerName: string;
  className?: string;
  onSuccess?: () => void;
}

const QUICK_ACTIONS: QuickProgressAction[] = [
  {
    id: 'great_session',
    title: 'Great!',
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

export default function QuickProgressActions({
  bookingId,
  sessionId,
  swimmerId,
  swimmerName,
  className,
  onSuccess,
}: QuickProgressActionsProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleQuickAction = async (action: QuickProgressAction) => {
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
    <Card className={cn('border-dashed border-2', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Quick Update
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            One-click progress update for {swimmerName}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  size="sm"
                  className={cn(
                    'h-auto py-2 flex flex-col items-center justify-center gap-1 text-white',
                    action.color,
                    submitting === action.id && 'opacity-50'
                  )}
                  onClick={() => handleQuickAction(action)}
                  disabled={submitting !== null}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Click for detailed update
          </p>
        </div>
      </CardContent>
    </Card>
  );
}