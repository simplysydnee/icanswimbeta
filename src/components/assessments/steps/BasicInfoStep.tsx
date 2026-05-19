'use client';

import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  User,
  Users,
  Search,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledSwimmerRow {
  swimmerId: string;
  swimmerName: string;
  paymentType: string | null;
  fundingSourceId: string | null;
  parentName: string | null;
  parentEmail: string | null;
  bookingId: string;
  sessionId: string;
  sessionStartTime: string | null;
  sessionLocation: string | null;
  instructorId: string | null;
  instructorName: string | null;
}

interface BasicInfoStepProps {
  data: {
    swimmerId: string;
    swimmerName?: string;
    bookingId?: string;
    sessionId?: string;
    instructor: string;
    assessmentDate: Date;
    strengths: string;
    challenges: string;
  };
  onChange: (data: Partial<BasicInfoStepProps['data']>) => void;
  /**
   * Called after a swimmer is selected and the server-side draft has been
   * fetched. Lets the parent wizard splat persisted fields (strengths,
   * challenges, swim skills, roadblocks, goals, Step 5 notes) back onto its
   * state so the user picks up where they left off.
   */
  onHydrate?: (draft: Record<string, any>) => void;
}

const getPaymentTypeLabel = (type: string | null) => {
  switch (type) {
    case 'private_pay':
      return 'Private Pay';
    case 'vmrc':
    case 'funded':
      return 'Funded';
    case 'scholarship':
      return 'Scholarship';
    default:
      return type || '—';
  }
};

export function BasicInfoStep({ data, onChange, onHydrate }: BasicInfoStepProps) {
  const [swimmers, setSwimmers] = useState<ScheduledSwimmerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch('/api/assessments/scheduled-swimmers');
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        const rows: ScheduledSwimmerRow[] = await response.json();
        if (!cancelled) setSwimmers(rows);
      } catch (err) {
        console.error('Error loading scheduled swimmers:', err);
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load swimmers'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSwimmers = useMemo(() => {
    if (!searchQuery.trim()) return swimmers;
    const q = searchQuery.toLowerCase();
    return swimmers.filter((s) => {
      return (
        s.swimmerName.toLowerCase().includes(q) ||
        (s.parentName || '').toLowerCase().includes(q) ||
        (s.instructorName || '').toLowerCase().includes(q)
      );
    });
  }, [swimmers, searchQuery]);

  const selected = swimmers.find((s) => s.swimmerId === data.swimmerId) || null;

  const handleSelect = async (swimmer: ScheduledSwimmerRow) => {
    onChange({
      swimmerId: swimmer.swimmerId,
      swimmerName: swimmer.swimmerName,
      bookingId: swimmer.bookingId,
      sessionId: swimmer.sessionId,
      instructor: swimmer.instructorName || swimmer.instructorId || '',
      assessmentDate: swimmer.sessionStartTime
        ? new Date(swimmer.sessionStartTime)
        : new Date(),
    });

    // Silently hydrate any in-progress draft for this booking. If the fetch
    // fails or no draft exists, we just stay with the freshly-selected blanks.
    if (!onHydrate) return;
    try {
      const response = await fetch(
        `/api/assessments/wizard/draft?bookingId=${encodeURIComponent(swimmer.bookingId)}`
      );
      if (!response.ok) return;
      const payload = await response.json();
      if (!payload?.exists) return;

      // Strip nulls so the wizard's defaults aren't clobbered by missing
      // optional fields (e.g. progress_notes that don't exist yet).
      const draft: Record<string, any> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (k === 'exists' || k === 'assessmentId' || k === 'assessmentReportId') continue;
        if (v !== null && v !== undefined) draft[k] = v;
      }
      onHydrate(draft);
    } catch (err) {
      console.warn('Could not hydrate assessment draft:', err);
    }
  };

  const handleClearSelection = () => {
    onChange({
      swimmerId: '',
      swimmerName: '',
      bookingId: '',
      sessionId: '',
      instructor: '',
      assessmentDate: new Date(),
    });
  };

  const formattedSessionTime = selected?.sessionStartTime
    ? format(new Date(selected.sessionStartTime), 'PPP p')
    : data.assessmentDate
    ? format(data.assessmentDate, 'PPP')
    : '';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Basic Information</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a swimmer with a scheduled assessment. Instructor and date are
          pulled from the assessment booking.
        </p>
      </div>

      {/* Swimmer selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Swimmer <span className="text-red-500">*</span>
        </Label>

        {!selected && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by swimmer, parent, or instructor name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading swimmers with scheduled assessments…
              </div>
            )}

            {loadError && !loading && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {loadError}
              </div>
            )}

            {!loading && !loadError && filteredSwimmers.length === 0 && (
              <div className="p-4 border rounded-lg text-sm text-muted-foreground text-center">
                No swimmers with a scheduled assessment found.
                {swimmers.length > 0 && searchQuery
                  ? ' Try a different search term.'
                  : ' Schedule an assessment session first.'}
              </div>
            )}

            {!loading && filteredSwimmers.length > 0 && (
              <div className="border rounded-lg max-h-[320px] overflow-y-auto divide-y">
                {filteredSwimmers.map((swimmer) => (
                  <button
                    key={swimmer.swimmerId}
                    type="button"
                    onClick={() => handleSelect(swimmer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{swimmer.swimmerName}</p>
                        <p className="text-xs text-muted-foreground">
                          Parent: {swimmer.parentName || 'Unknown'} ·{' '}
                          {swimmer.sessionStartTime
                            ? format(
                                new Date(swimmer.sessionStartTime),
                                'PPP p'
                              )
                            : 'No time'}
                          {swimmer.instructorName
                            ? ` · ${swimmer.instructorName}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {getPaymentTypeLabel(swimmer.paymentType)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{selected.swimmerName}</p>
                  <p className="text-sm text-gray-600">
                    Parent: {selected.parentName || 'Unknown'}
                    {selected.parentEmail ? ` · ${selected.parentEmail}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-sm text-blue-700 hover:text-blue-900 underline"
              >
                Change
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary">
                {getPaymentTypeLabel(selected.paymentType)}
              </Badge>
              {selected.sessionLocation && (
                <Badge variant="outline">{selected.sessionLocation}</Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructor (read-only, pulled from booking) */}
      <div className="space-y-2">
        <Label htmlFor="instructor-display" className="text-sm font-medium">
          Instructor <span className="text-red-500">*</span>
        </Label>
        <Input
          id="instructor-display"
          value={data.instructor || ''}
          readOnly
          disabled
          placeholder="Select a swimmer to load instructor"
        />
        <p className="text-xs text-muted-foreground">
          Auto-filled from the assessment booking. Cannot be changed here.
        </p>
      </div>

      {/* Assessment Date (read-only, pulled from booking) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Date of Assessment <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className={formattedSessionTime ? '' : 'text-muted-foreground'}>
            {formattedSessionTime || 'Select a swimmer to load date'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-filled from the assessment booking. Cannot be changed here.
        </p>
      </div>

      {/* Strengths */}
      <div className="space-y-2">
        <Label htmlFor="strengths" className="text-sm font-medium">
          Swimmer's Strengths <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="strengths"
          placeholder="What are the swimmer's strengths? What do they do well?"
          value={data.strengths}
          onChange={(e) => onChange({ strengths: e.target.value })}
          className="min-h-[100px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Describe what the swimmer does well in the water
        </p>
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        <Label htmlFor="challenges" className="text-sm font-medium">
          Swimmer's Challenges or Concerns{' '}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="challenges"
          placeholder="What challenges or concerns did you observe? What areas need improvement?"
          value={data.challenges}
          onChange={(e) => onChange({ challenges: e.target.value })}
          className="min-h-[100px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Describe any challenges, concerns, or areas needing improvement
        </p>
      </div>
    </div>
  );
}
