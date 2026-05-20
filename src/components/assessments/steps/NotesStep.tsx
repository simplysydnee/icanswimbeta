'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, MessageSquare, Smile, Droplets, Share2 } from 'lucide-react';

interface NotesStepData {
  lessonDate: string;
  attendanceStatus: 'present' | 'absent' | 'late';
  lessonSummary: string;
  swimmerMood: 'happy' | 'neutral' | 'frustrated' | 'tired' | '';
  waterComfort: 'comfortable' | 'cautious' | 'anxious' | '';
  instructorNotesPrivate: string;
  parentNotes: string;
  sharedWithParent: boolean;
}

interface NotesStepProps {
  data: NotesStepData;
  onChange: (data: Partial<NotesStepData>) => void;
}

export function NotesStep({ data, onChange }: NotesStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Lesson Notes</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Optional progress note for this assessment session. All fields are
          optional &mdash; leave blank to skip.
        </p>
      </div>

      {/* Lesson Date */}
      <div className="space-y-2">
        <Label htmlFor="lessonDate">Lesson Date</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="lessonDate"
            type="date"
            value={data.lessonDate}
            onChange={(e) => onChange({ lessonDate: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      {/* Attendance */}
      <div className="space-y-2">
        <Label>Attendance</Label>
        <Select
          value={data.attendanceStatus}
          onValueChange={(value: 'present' | 'absent' | 'late') =>
            onChange({ attendanceStatus: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select attendance status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="present">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Present</span>
              </div>
            </SelectItem>
            <SelectItem value="absent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Absent</span>
              </div>
            </SelectItem>
            <SelectItem value="late">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Late</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lesson Summary */}
      <div className="space-y-2">
        <Label htmlFor="lessonSummary">Lesson Summary</Label>
        <Textarea
          id="lessonSummary"
          placeholder="Describe today's assessment, progress made, challenges faced, and overall observations…"
          value={data.lessonSummary}
          onChange={(e) => onChange({ lessonSummary: e.target.value })}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Optional. Main description of the assessment session.
        </p>
      </div>

      {/* Mood + Water Comfort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Swimmer Mood (Optional)
          </Label>
          <Select
            value={data.swimmerMood || undefined}
            onValueChange={(value: 'happy' | 'neutral' | 'frustrated' | 'tired') =>
              onChange({ swimmerMood: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="happy">Happy</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="frustrated">Frustrated</SelectItem>
              <SelectItem value="tired">Tired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Water Comfort (Optional)
          </Label>
          <Select
            value={data.waterComfort || undefined}
            onValueChange={(value: 'comfortable' | 'cautious' | 'anxious') =>
              onChange({ waterComfort: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select comfort level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="cautious">Cautious</SelectItem>
              <SelectItem value="anxious">Anxious</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="instructorNotesPrivate">
            Instructor Notes (Private)
          </Label>
          <Textarea
            id="instructorNotesPrivate"
            placeholder="Private notes for instructors only…"
            value={data.instructorNotesPrivate}
            onChange={(e) =>
              onChange({ instructorNotesPrivate: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="parentNotes" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Parent Notes (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="shareWithParent"
                checked={data.sharedWithParent}
                onCheckedChange={(checked) =>
                  onChange({ sharedWithParent: checked === true })
                }
              />
              <Label
                htmlFor="shareWithParent"
                className="text-sm cursor-pointer"
              >
                Share with parent
              </Label>
            </div>
          </div>
          <Textarea
            id="parentNotes"
            placeholder="Notes to share with swimmer's family…"
            value={data.parentNotes}
            onChange={(e) => onChange({ parentNotes: e.target.value })}
            rows={3}
            disabled={!data.sharedWithParent}
          />
          {data.sharedWithParent && (
            <p className="text-xs text-muted-foreground">
              These notes will be visible to the swimmer's parents.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
