'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Droplets,
  FileText,
  MessageSquare,
  Target,
  User,
  Users,
  XCircle,
} from 'lucide-react';

interface AssessmentDetailsModalProps {
  assessmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssessmentDetails {
  id: string;
  swimmer_name: string;
  swimmer_age: number;
  parent_name: string;
  parent_email: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  location: string;
  status: string;
  assessment_status: string;
  payment_type: string;
  is_funded_client: boolean;
  funding_source_name: string | null;
  diagnosis: string[];
  has_allergies: boolean;
  allergies_description: string | null;
  has_medical_conditions: boolean;
  medical_conditions_description: string | null;
  report: {
    strengths: string;
    challenges: string;
    swim_skills: Record<string, string>;
    roadblocks: Record<string, { needsAddressing: boolean; intervention: string }>;
    swim_skills_goals: string;
    safety_goals: string;
    approval_status: string | null;
    updated_at: string;
  } | null;
  note: {
    lesson_date: string | null;
    attendance_status: string | null;
    lesson_summary: string;
    swimmer_mood: string;
    water_comfort: string;
    instructor_notes: string;
    parent_notes: string;
    shared_with_parent: boolean;
    updated_at: string;
  } | null;
}

const SKILL_VALUE_LABEL: Record<string, { label: string; className: string }> = {
  yes: { label: 'Yes', className: 'bg-green-100 text-green-800' },
  emerging: { label: 'Emerging', className: 'bg-amber-100 text-amber-800' },
  no: { label: 'No', className: 'bg-red-100 text-red-700' },
  na: { label: 'N/A', className: 'bg-gray-100 text-gray-700' },
};

const titleCase = (s: string) =>
  s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function AssessmentDetailsModal({
  assessmentId,
  open,
  onOpenChange,
}: AssessmentDetailsModalProps) {
  const [details, setDetails] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !assessmentId) {
      setDetails(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/assessments/${assessmentId}`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.details || err?.error || `Request failed (${response.status})`);
        }
        const data = await response.json();
        if (!cancelled) setDetails(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assessment details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, assessmentId]);

  const report = details?.report;
  const note = details?.note;
  const swimSkillsEntries = report
    ? Object.entries(report.swim_skills || {})
    : [];
  const roadblockEntries = report
    ? Object.entries(report.roadblocks || {}).filter(
        ([, v]) => v && v.needsAddressing
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Assessment Details
          </DialogTitle>
          {details && (
            <DialogDescription>
              {details.swimmer_name} &middot;{' '}
              {details.start_time
                ? format(new Date(details.start_time), 'PPP p')
                : ''}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="font-medium">Couldn't load details:</span> {error}
          </div>
        )}

        {details && !loading && !error && (
          <div className="space-y-6">
            {/* Overview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Swimmer
                </div>
                <div className="font-medium">
                  {details.swimmer_name}{' '}
                  <span className="font-normal text-muted-foreground">
                    ({details.swimmer_age} yrs)
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Scheduled
                </div>
                <div className="font-medium">
                  {format(new Date(details.start_time), 'PPP p')} &ndash;{' '}
                  {format(new Date(details.end_time), 'p')}
                </div>
                {details.location && (
                  <div className="text-xs text-muted-foreground">
                    {details.location}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Instructor
                </div>
                <div className="font-medium">{details.instructor_name}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> Parent
                </div>
                <div className="font-medium">{details.parent_name}</div>
                {details.parent_email && (
                  <div className="text-xs text-muted-foreground">
                    {details.parent_email}
                  </div>
                )}
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Booking: {details.status}</Badge>
              <Badge variant="outline">
                Assessment status: {details.assessment_status || '—'}
              </Badge>
              {details.is_funded_client && (
                <Badge variant="secondary">
                  {details.funding_source_name || 'Funded'}
                </Badge>
              )}
              {(details.diagnosis || []).slice(0, 3).map((d) => (
                <Badge key={d} variant="outline">
                  {d}
                </Badge>
              ))}
            </div>

            {(details.has_allergies || details.has_medical_conditions) && (
              <section className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-sm">
                <div className="flex items-center gap-2 font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> Medical / safety flags
                </div>
                {details.has_allergies && (
                  <div className="text-amber-900">
                    <span className="font-medium">Allergies:</span>{' '}
                    {details.allergies_description || '(no description)'}
                  </div>
                )}
                {details.has_medical_conditions && (
                  <div className="text-amber-900">
                    <span className="font-medium">Medical conditions:</span>{' '}
                    {details.medical_conditions_description ||
                      '(no description)'}
                  </div>
                )}
              </section>
            )}

            {/* Wizard report */}
            {!report ? (
              <section className="p-4 border rounded-lg text-sm text-muted-foreground">
                No wizard data yet. The instructor or admin hasn't started the
                assessment-completion wizard for this booking.
              </section>
            ) : (
              <>
                {report.approval_status && (
                  <div className="flex items-center gap-2">
                    {report.approval_status === 'approved' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" /> Dropped
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(report.updated_at), 'PPp')}
                    </span>
                  </div>
                )}

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-medium">Strengths</div>
                    <div className="whitespace-pre-wrap text-muted-foreground">
                      {report.strengths || '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Challenges</div>
                    <div className="whitespace-pre-wrap text-muted-foreground">
                      {report.challenges || '—'}
                    </div>
                  </div>
                </section>

                {swimSkillsEntries.length > 0 && (
                  <section>
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-600" /> Swim Skills
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {swimSkillsEntries.map(([key, value]) => {
                        const meta = SKILL_VALUE_LABEL[value as string] || {
                          label: String(value),
                          className: 'bg-gray-100 text-gray-700',
                        };
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between border-b py-1"
                          >
                            <span>{titleCase(key)}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {roadblockEntries.length > 0 && (
                  <section>
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />{' '}
                      Roadblocks to Address
                    </div>
                    <ul className="space-y-2 text-sm">
                      {roadblockEntries.map(([key, value]) => (
                        <li
                          key={key}
                          className="p-2 border rounded bg-amber-50/60"
                        >
                          <div className="font-medium">{titleCase(key)}</div>
                          {value.intervention && (
                            <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
                              {value.intervention}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(report.swim_skills_goals || report.safety_goals) && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {report.swim_skills_goals && (
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" /> Swim
                          Skills Goals
                        </div>
                        <div className="whitespace-pre-wrap text-muted-foreground">
                          {report.swim_skills_goals}
                        </div>
                      </div>
                    )}
                    {report.safety_goals && (
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-red-600" /> Safety
                          Goals
                        </div>
                        <div className="whitespace-pre-wrap text-muted-foreground">
                          {report.safety_goals}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* Progress note */}
            {note && (
              <section className="p-3 border rounded-lg space-y-2 text-sm">
                <div className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan-600" /> Lesson
                  Note
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.attendance_status && (
                    <Badge variant="outline">
                      Attendance: {note.attendance_status}
                    </Badge>
                  )}
                  {note.swimmer_mood && (
                    <Badge variant="outline">Mood: {note.swimmer_mood}</Badge>
                  )}
                  {note.water_comfort && (
                    <Badge variant="outline">
                      Water comfort: {note.water_comfort}
                    </Badge>
                  )}
                  {note.shared_with_parent && (
                    <Badge className="bg-green-100 text-green-800">
                      Shared with parent
                    </Badge>
                  )}
                </div>
                {note.lesson_summary && (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {note.lesson_summary}
                  </div>
                )}
                {note.instructor_notes && (
                  <div>
                    <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      Instructor (private)
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {note.instructor_notes}
                    </div>
                  </div>
                )}
                {note.parent_notes && note.shared_with_parent && (
                  <div>
                    <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      Parent-visible
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {note.parent_notes}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
