'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Save, Loader2, CheckCircle, AlertCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SkillChecklist } from './SkillChecklist';

interface ProgressNoteFormProps {
  sessionId: string;
  bookingId: string;
  swimmerId: string;
  /** When set, navigate here after a successful save instead of the default instructor progress list */
  redirectAfterSave?: string | null;
  sessionData?: {
    startTime: string;
    endTime: string;
    location: string;
    swimmer: {
      firstName: string;
      lastName: string;
      currentLevelId: string;
    };
  };
  existingNote?: {
    id: string;
    lessonSummary: string;
    instructorNotes: string;
    parentNotes: string;
    skillsWorkingOn: string[];
    skillsMastered: string[];
    currentLevelId: string;
    sharedWithParent: boolean;
    attendanceStatus: string;
    swimmerMood?: string;
    waterComfort?: string;
    focusLevel?: string;
  };
}

/** Map GET /api/progress-notes row (snake_case) or camelCase into form shape */
function mapExistingNoteInput(note: Record<string, unknown> | undefined): ProgressNoteFormProps['existingNote'] | undefined {
  if (!note?.id) return undefined;
  const str = (camel: string, snake: string) => {
    const v = note[camel] ?? note[snake];
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  };
  const arr = (camel: string, snake: string): string[] => {
    const v = note[camel] ?? note[snake];
    return Array.isArray(v) ? (v as string[]) : [];
  };
  const bool = (camel: string, snake: string) => {
    const v = note[camel] ?? note[snake];
    return Boolean(v);
  };
  return {
    id: String(note.id),
    lessonSummary: str('lessonSummary', 'lesson_summary'),
    instructorNotes: str('instructorNotes', 'instructor_notes'),
    parentNotes: str('parentNotes', 'parent_notes'),
    skillsWorkingOn: arr('skillsWorkingOn', 'skills_working_on'),
    skillsMastered: arr('skillsMastered', 'skills_mastered'),
    currentLevelId: str('currentLevelId', 'current_level_id'),
    sharedWithParent: bool('sharedWithParent', 'shared_with_parent'),
    attendanceStatus: str('attendanceStatus', 'attendance_status') || 'present',
    swimmerMood: str('swimmerMood', 'swimmer_mood') || undefined,
    waterComfort: str('waterComfort', 'water_comfort') || undefined,
    focusLevel: str('focusLevel', 'focus_level') || undefined,
  };
}

export function ProgressNoteForm({
  sessionId,
  bookingId,
  swimmerId,
  redirectAfterSave,
  sessionData,
  existingNote,
}: ProgressNoteFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const normalizedNote = mapExistingNoteInput(existingNote as Record<string, unknown> | undefined);

  // Form state
  const [lessonSummary, setLessonSummary] = useState(normalizedNote?.lessonSummary || '');
  const [instructorNotes, setInstructorNotes] = useState(normalizedNote?.instructorNotes || '');
  const [parentNotes, setParentNotes] = useState(normalizedNote?.parentNotes || '');
  const [sharedWithParent, setSharedWithParent] = useState(normalizedNote?.sharedWithParent || false);
  const [attendanceStatus, setAttendanceStatus] = useState(normalizedNote?.attendanceStatus || 'present');
  const [swimmerMood, setSwimmerMood] = useState(normalizedNote?.swimmerMood || '');
  const [waterComfort, setWaterComfort] = useState(normalizedNote?.waterComfort || '');
  const [focusLevel, setFocusLevel] = useState(normalizedNote?.focusLevel || '');

  // Skill tracking
  const [skillsWorkingOn, setSkillsWorkingOn] = useState<string[]>(normalizedNote?.skillsWorkingOn || []);
  const [skillsMastered, setSkillsMastered] = useState<string[]>(normalizedNote?.skillsMastered || []);

  useEffect(() => {
    const n = mapExistingNoteInput(existingNote as Record<string, unknown> | undefined);
    if (!n) return;
    setLessonSummary(n.lessonSummary);
    setInstructorNotes(n.instructorNotes);
    setParentNotes(n.parentNotes);
    setSharedWithParent(n.sharedWithParent);
    setAttendanceStatus(n.attendanceStatus || 'present');
    setSwimmerMood(n.swimmerMood || '');
    setWaterComfort(n.waterComfort || '');
    setFocusLevel(n.focusLevel || '');
    setSkillsWorkingOn(n.skillsWorkingOn);
    setSkillsMastered(n.skillsMastered);
  }, [existingNote?.id]);

  const handleSkillsChange = (workingOn: string[], mastered: string[]) => {
    setSkillsWorkingOn(workingOn);
    setSkillsMastered(mastered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/progress-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bookingId,
          swimmerId,
          lessonSummary,
          instructorNotes,
          parentNotes,
          skillsWorkingOn,
          skillsMastered,
          currentLevelId: sessionData?.swimmer.currentLevelId,
          sharedWithParent,
          attendanceStatus,
          swimmerMood: swimmerMood || undefined,
          waterComfort: waterComfort || undefined,
          focusLevel: focusLevel || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save progress note');
      }

      setSuccess(true);
      const safeReturn =
        redirectAfterSave &&
        redirectAfterSave.startsWith('/') &&
        !redirectAfterSave.startsWith('//');
      const nextPath = safeReturn ? redirectAfterSave : '/instructor/progress';
      setTimeout(() => {
        router.push(nextPath);
        router.refresh();
      }, 1500);

    } catch (err) {
      console.error('Error saving progress note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save progress note');
    } finally {
      setSaving(false);
    }
  };

  const attendanceOptions = [
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'absent', label: 'Absent' },
    { value: 'no_show', label: 'No Show' },
  ];

  const moodOptions = [
    { value: 'happy', label: 'Happy/Excited' },
    { value: 'calm', label: 'Calm/Relaxed' },
    { value: 'anxious', label: 'Anxious/Nervous' },
    { value: 'resistant', label: 'Resistant' },
    { value: 'tired', label: 'Tired' },
    { value: 'other', label: 'Other' },
  ];

  const comfortOptions = [
    { value: 'very_comfortable', label: 'Very Comfortable' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'somewhat_comfortable', label: 'Somewhat Comfortable' },
    { value: 'uncomfortable', label: 'Uncomfortable' },
    { value: 'very_uncomfortable', label: 'Very Uncomfortable' },
  ];

  const focusOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'distracted', label: 'Distracted' },
  ];


  if (success) {
    return (
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Progress note saved successfully!
            {redirectAfterSave &&
            redirectAfterSave.startsWith('/') &&
            !redirectAfterSave.startsWith('//')
              ? ' Redirecting to the next step...'
              : ' Redirecting back to sessions...'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Info Card */}
      {sessionData && (
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              {format(parseISO(sessionData.startTime), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {sessionData.swimmer.firstName} {sessionData.swimmer.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(sessionData.startTime), 'EEEE')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(sessionData.startTime), 'h:mm a')} -{' '}
                    {format(parseISO(sessionData.endTime), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{sessionData.location}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance & Observation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance & Observation</CardTitle>
          <CardDescription>Record swimmer&apos;s status and mood</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendance">Attendance Status</Label>
              <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {attendanceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Swimmer Mood</Label>
              <Select value={swimmerMood} onValueChange={setSwimmerMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comfort">Water Comfort</Label>
              <Select value={waterComfort} onValueChange={setWaterComfort}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comfort level" />
                </SelectTrigger>
                <SelectContent>
                  {comfortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">Focus Level</Label>
            <Select value={focusLevel} onValueChange={setFocusLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select focus level" />
              </SelectTrigger>
              <SelectContent>
                {focusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skill Checklist */}
      <SkillChecklist
        swimmerId={swimmerId}
        onSkillsChange={handleSkillsChange}
        initialWorkingOn={normalizedNote?.skillsWorkingOn}
        initialMastered={normalizedNote?.skillsMastered}
      />

      {/* Lesson Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Summary</CardTitle>
          <CardDescription>
            What was covered in today&apos;s lesson? This will be visible to parents if shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lessonSummary">Lesson Summary *</Label>
            <Textarea
              id="lessonSummary"
              value={lessonSummary}
              onChange={(e) => setLessonSummary(e.target.value)}
              placeholder="Describe what was covered in today's lesson, progress made, challenges faced, and goals for next session..."
              rows={6}
              required
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Required. Be specific about skills worked on, swimmer&apos;s response, and any notable achievements.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentNotes">Notes for Parents</Label>
            <Textarea
              id="parentNotes"
              value={parentNotes}
              onChange={(e) => setParentNotes(e.target.value)}
              placeholder="Optional notes to share with parents. Keep it positive and encouraging!"
              rows={4}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              These notes will be visible to parents if you choose to share this progress note.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorNotes">Internal Instructor Notes</Label>
            <Textarea
              id="instructorNotes"
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              placeholder="Internal notes for instructors only. Not visible to parents."
              rows={4}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Private notes for instructor reference. Not shared with parents.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sharing & Submission Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sharing & Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="share-with-parent" className="font-medium">
                Share with Parent
              </Label>
              <p className="text-sm text-muted-foreground">
                Make this progress note visible to the swimmer&apos;s parent
              </p>
            </div>
            <Switch
              id="share-with-parent"
              checked={sharedWithParent}
              onCheckedChange={setSharedWithParent}
            />
          </div>

          {sharedWithParent && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This progress note will be visible to the parent. Please ensure all information is appropriate for sharing.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {normalizedNote ? 'Updating existing progress note' : 'Creating new progress note'}
            </div>
            <Button type="submit" disabled={saving || !lessonSummary.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {normalizedNote ? 'Update Progress Note' : 'Save Progress Note'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}