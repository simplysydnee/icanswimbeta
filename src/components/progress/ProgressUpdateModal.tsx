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
import { Clock, FileText, Award, Star, Target } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface Skill {
  id: string;
  name: string;
  description: string;
  sequence: number;
  status?: 'not_started' | 'in_progress' | 'mastered';
}

interface SwimLevel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sequence: number;
}

interface ProgressUpdateModalProps {
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

export default function ProgressUpdateModal({
  open,
  onOpenChange,
  bookingId,
  sessionId,
  swimmerId,
  swimmerName,
  swimmerPhotoUrl,
  sessionTime,
  onSuccess,
}: ProgressUpdateModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentLevel, setCurrentLevel] = useState<SwimLevel | null>(null);
  const [nextLevels, setNextLevels] = useState<SwimLevel[]>([]);
  const [lessonSummary, setLessonSummary] = useState('');
  const [instructorNotes, setInstructorNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');
  const [selectedNextLevelId, setSelectedNextLevelId] = useState<string>('');
  const [sharedWithParent, setSharedWithParent] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [swimmerMood, setSwimmerMood] = useState('');
  const [waterComfort, setWaterComfort] = useState('');
  const [focusLevel, setFocusLevel] = useState('');

  useEffect(() => {
    if (open) {
      fetchSwimmerData();
    }
  }, [open, swimmerId]);

  const fetchSwimmerData = async () => {
    setLoading(true);
    try {
      // Fetch swimmer's current level and skills
      const swimmerResponse = await fetch(`/api/swimmers/${swimmerId}/skills`);
      if (swimmerResponse.ok) {
        const swimmerData = await swimmerResponse.json();
        setCurrentLevel(swimmerData.currentLevel);
        setSkills(swimmerData.skills || []);

        // Fetch next levels
        if (swimmerData.currentLevel) {
          const levelsResponse = await fetch(`/api/swim-levels?current=${swimmerData.currentLevel.id}`);
          if (levelsResponse.ok) {
            const levelsData = await levelsResponse.json();
            setNextLevels(levelsData.nextLevels || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching swimmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillStatusChange = (skillId: string, status: 'not_started' | 'in_progress' | 'mastered') => {
    setSkills(prev => prev.map(skill =>
      skill.id === skillId ? { ...skill, status } : skill
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const skillsWorkingOn = skills
        .filter(skill => skill.status === 'in_progress')
        .map(skill => skill.id);

      const skillsMastered = skills
        .filter(skill => skill.status === 'mastered')
        .map(skill => skill.id);

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
          skillsWorkingOn,
          skillsMastered,
          currentLevelId: selectedNextLevelId || currentLevel?.id,
          sharedWithParent,
          attendanceStatus,
          swimmerMood,
          waterComfort,
          focusLevel,
        }),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Error submitting progress:', error);
        alert(`Failed to submit progress: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert('Failed to submit progress. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLessonSummary('');
    setInstructorNotes('');
    setParentNotes('');
    setSelectedNextLevelId('');
    setSharedWithParent(false);
    setAttendanceStatus('present');
    setSwimmerMood('');
    setWaterComfort('');
    setFocusLevel('');
    setSkills(prev => prev.map(skill => ({ ...skill, status: undefined })));
  };


  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Loading swimmer data...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="progress-update-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Update Progress
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

        {/* Attendance & Mood */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Attendance</Label>
            <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="left_early">Left Early</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Swimmer Mood</Label>
            <Select value={swimmerMood} onValueChange={setSwimmerMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="happy">Happy</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
                <SelectItem value="tired">Tired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Water Comfort</Label>
            <Select value={waterComfort} onValueChange={setWaterComfort}>
              <SelectTrigger>
                <SelectValue placeholder="Select comfort level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_comfortable">Very Comfortable</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="uncomfortable">Uncomfortable</SelectItem>
                <SelectItem value="very_uncomfortable">Very Uncomfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-medium">Skills</Label>
            <Badge variant="outline">
              {skills.filter(s => s.status === 'mastered').length} mastered • {skills.filter(s => s.status === 'in_progress').length} in progress
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                </div>
                <RadioGroup
                  value={skill.status || 'not_started'}
                  onValueChange={(value) => handleSkillStatusChange(skill.id, value as any)}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="not_started" id={`${skill.id}-not_started`} />
                    <Label htmlFor={`${skill.id}-not_started`} className="text-xs cursor-pointer">
                      Not Started
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="in_progress" id={`${skill.id}-in_progress`} />
                    <Label htmlFor={`${skill.id}-in_progress`} className="text-xs cursor-pointer">
                      In Progress
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="mastered" id={`${skill.id}-mastered`} />
                    <Label htmlFor={`${skill.id}-mastered`} className="text-xs cursor-pointer">
                      Mastered
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>

        {/* Level Advancement */}
        {nextLevels.length > 0 && (
          <div className="space-y-3">
            <Label className="text-lg font-medium">Level Advancement</Label>
            <p className="text-sm text-muted-foreground">
              Is {swimmerName.split(' ')[0]} ready to advance to the next level?
            </p>
            <Select value={selectedNextLevelId} onValueChange={setSelectedNextLevelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select next level (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep at current level</SelectItem>
                {nextLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.display_name || level.name} - {level.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lesson Summary *</Label>
            <Textarea
              placeholder="What did you work on today? What went well? What needs improvement?"
              value={lessonSummary}
              onChange={(e) => setLessonSummary(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Instructor Notes (Private)</Label>
            <Textarea
              placeholder="Private notes for instructors and admins only"
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              rows={2}
            />
          </div>
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
              disabled={!sharedWithParent}
            />
          </div>
        </div>

        {/* Focus Level */}
        <div className="space-y-2">
          <Label>Focus Level</Label>
          <RadioGroup value={focusLevel} onValueChange={setFocusLevel} className="grid grid-cols-3 gap-2">
            <div>
              <RadioGroupItem value="high" id="focus-high" className="peer sr-only" />
              <Label
                htmlFor="focus-high"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Star className="h-6 w-6 mb-2 text-yellow-500" />
                <span className="text-sm">High</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="medium" id="focus-medium" className="peer sr-only" />
              <Label
                htmlFor="focus-medium"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Target className="h-6 w-6 mb-2 text-blue-500" />
                <span className="text-sm">Medium</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="low" id="focus-low" className="peer sr-only" />
              <Label
                htmlFor="focus-low"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Clock className="h-6 w-6 mb-2 text-gray-500" />
                <span className="text-sm">Low</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !lessonSummary.trim()}>
            {submitting ? 'Submitting...' : 'Submit Progress Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}