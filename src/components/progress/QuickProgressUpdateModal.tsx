'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, Award, Star, Target, User, ThumbsUp, ThumbsDown, Zap, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SwimLevel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sequence: number;
}

interface QuickProgressUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  sessionId: string;
  swimmerId: string;
  swimmerName: string;
  swimmerPhotoUrl?: string;
  sessionTime: string;
  onSuccess: () => void;
}

// Quick update presets
const QUICK_PRESETS = [
  {
    id: 'great_session',
    title: 'Great Session!',
    icon: ThumbsUp,
    color: 'bg-green-100 text-green-800 border-green-200',
    summary: 'Swimmer did great today! Focused well and made good progress.',
    mood: 'happy',
    waterComfort: 'comfortable',
    focusLevel: 'high'
  },
  {
    id: 'good_progress',
    title: 'Good Progress',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    summary: 'Made steady progress on skills. Good effort and participation.',
    mood: 'engaged',
    waterComfort: 'comfortable',
    focusLevel: 'medium'
  },
  {
    id: 'needs_work',
    title: 'Needs Work',
    icon: Target,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    summary: 'Some skills need more practice. Will focus on these next session.',
    mood: 'neutral',
    waterComfort: 'neutral',
    focusLevel: 'medium'
  },
  {
    id: 'challenging',
    title: 'Challenging Day',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    summary: 'Swimmer had a challenging day. Will try different approach next time.',
    mood: 'anxious',
    waterComfort: 'uncomfortable',
    focusLevel: 'low'
  }
];

export default function QuickProgressUpdateModal({
  open,
  onOpenChange,
  bookingId,
  sessionId,
  swimmerId,
  swimmerName,
  swimmerPhotoUrl,
  sessionTime,
  onSuccess,
}: QuickProgressUpdateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<SwimLevel | null>(null);
  const [lessonSummary, setLessonSummary] = useState('');
  const [instructorNotes, setInstructorNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');
  const [sharedWithParent, setSharedWithParent] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [swimmerMood, setSwimmerMood] = useState('neutral');
  const [waterComfort, setWaterComfort] = useState('neutral');
  const [focusLevel, setFocusLevel] = useState('medium');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSwimmerData();
    }
  }, [open, swimmerId]);

  const fetchSwimmerData = async () => {
    setLoading(true);
    try {
      // Fetch swimmer's current level
      const swimmerResponse = await fetch(`/api/swimmers/${swimmerId}/skills`);
      if (swimmerResponse.ok) {
        const swimmerData = await swimmerResponse.json();
        setCurrentLevel(swimmerData.currentLevel);
      }
    } catch (error) {
      console.error('Error fetching swimmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    setLessonSummary(preset.summary);
    setSwimmerMood(preset.mood);
    setWaterComfort(preset.waterComfort);
    setFocusLevel(preset.focusLevel);
  };

  const handleSubmit = async () => {
    if (!lessonSummary.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please add a lesson summary',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
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
          lessonSummary,
          instructorNotes,
          parentNotes,
          skillsWorkingOn: [], // Empty for quick updates
          skillsMastered: [], // Empty for quick updates
          currentLevelId: currentLevel?.id,
          sharedWithParent,
          attendanceStatus,
          swimmerMood,
          waterComfort,
          focusLevel,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Progress updated successfully',
          variant: 'default',
        });
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit progress',
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
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLessonSummary('');
    setInstructorNotes('');
    setParentNotes('');
    setSharedWithParent(false);
    setAttendanceStatus('present');
    setSwimmerMood('neutral');
    setWaterComfort('neutral');
    setFocusLevel('medium');
    setSelectedPreset(null);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Loading swimmer data...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[80vh] overflow-y-auto"
        aria-describedby="progress-update-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Progress Update
          </DialogTitle>
          <DialogDescription id="progress-update-description">
            Update progress for {swimmerName} from session at {format(new Date(sessionTime), 'h:mm a')}
          </DialogDescription>
        </DialogHeader>

        {/* Swimmer Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {swimmerPhotoUrl ? (
            <Image
              src={swimmerPhotoUrl}
              alt={swimmerName}
              width={48}
              height={48}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-cyan-100 text-cyan-700">
                {swimmerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="font-medium">{swimmerName}</p>
            {currentLevel && (
              <Badge variant="outline" className="mt-1">
                <Award className="h-3 w-3 mr-1" />
                {currentLevel.display_name || currentLevel.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-3">
          <Label>Quick Updates</Label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                className={cn(
                  'h-auto py-3 flex flex-col items-center justify-center gap-2',
                  selectedPreset === preset.id && preset.color
                )}
                onClick={() => applyPreset(preset.id)}
              >
                <preset.icon className="h-5 w-5" />
                <span className="text-sm">{preset.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div className="space-y-2">
          <Label>Attendance</Label>
          <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select attendance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">✅ Present</SelectItem>
              <SelectItem value="absent">❌ Absent</SelectItem>
              <SelectItem value="late">⏰ Late</SelectItem>
              <SelectItem value="left_early">🏃 Left Early</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mood & Comfort */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Swimmer Mood</Label>
            <Select value={swimmerMood} onValueChange={setSwimmerMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="happy">😊 Happy</SelectItem>
                <SelectItem value="engaged">🎯 Engaged</SelectItem>
                <SelectItem value="neutral">😐 Neutral</SelectItem>
                <SelectItem value="anxious">😟 Anxious</SelectItem>
                <SelectItem value="tired">😴 Tired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Water Comfort</Label>
            <Select value={waterComfort} onValueChange={setWaterComfort}>
              <SelectTrigger>
                <SelectValue placeholder="Select comfort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_comfortable">💧 Very Comfortable</SelectItem>
                <SelectItem value="comfortable">💦 Comfortable</SelectItem>
                <SelectItem value="neutral">🌊 Neutral</SelectItem>
                <SelectItem value="uncomfortable">🌧️ Uncomfortable</SelectItem>
                <SelectItem value="very_uncomfortable">🌊 Very Uncomfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Focus Level */}
        <div className="space-y-2">
          <Label>Focus Level</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={focusLevel === 'high' ? 'default' : 'outline'}
              className={cn(
                'flex flex-col items-center py-3 h-auto',
                focusLevel === 'high' && 'bg-yellow-500 hover:bg-yellow-600'
              )}
              onClick={() => setFocusLevel('high')}
            >
              <Zap className="h-5 w-5 mb-1" />
              <span className="text-xs">High</span>
            </Button>
            <Button
              variant={focusLevel === 'medium' ? 'default' : 'outline'}
              className={cn(
                'flex flex-col items-center py-3 h-auto',
                focusLevel === 'medium' && 'bg-blue-500 hover:bg-blue-600'
              )}
              onClick={() => setFocusLevel('medium')}
            >
              <Target className="h-5 w-5 mb-1" />
              <span className="text-xs">Medium</span>
            </Button>
            <Button
              variant={focusLevel === 'low' ? 'default' : 'outline'}
              className={cn(
                'flex flex-col items-center py-3 h-auto',
                focusLevel === 'low' && 'bg-gray-500 hover:bg-gray-600'
              )}
              onClick={() => setFocusLevel('low')}
            >
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-xs">Low</span>
            </Button>
          </div>
        </div>

        {/* Lesson Summary */}
        <div className="space-y-2">
          <Label>Lesson Summary *</Label>
          <Textarea
            placeholder="What did you work on today? What went well? What needs improvement?"
            value={lessonSummary}
            onChange={(e) => setLessonSummary(e.target.value)}
            rows={3}
            className="resize-none"
            required
          />
        </div>

        {/* Instructor Notes */}
        <div className="space-y-2">
          <Label>Instructor Notes (Private)</Label>
          <Textarea
            placeholder="Private notes for instructors and admins only"
            value={instructorNotes}
            onChange={(e) => setInstructorNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Parent Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Parent Notes</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shared-with-parent"
                checked={sharedWithParent}
                onCheckedChange={(checked) => setSharedWithParent(checked as boolean)}
              />
              <Label htmlFor="shared-with-parent" className="text-sm cursor-pointer">
                Share with parent
              </Label>
            </div>
          </div>
          <Textarea
            placeholder="Notes to share with parent (if sharing is enabled)"
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
            rows={2}
            className="resize-none"
            disabled={!sharedWithParent}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !lessonSummary.trim()}>
            {submitting ? 'Submitting...' : 'Submit Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}