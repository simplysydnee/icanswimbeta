'use client';

import { useState } from 'react';
import { DateSelectStep } from '@/components/booking/steps/DateSelectStep';
import { SessionType } from '@/types/booking';

export default function TestDateSelectStepPage() {
  const [sessionType, setSessionType] = useState<SessionType>('single');
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [recurringDay, setRecurringDay] = useState<number | null>(null);
  const [recurringTime, setRecurringTime] = useState<string | null>(null);
  const [recurringStartDate, setRecurringStartDate] = useState<Date | null>(null);
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [selectedRecurringSessions, setSelectedRecurringSessions] = useState<string[]>([]);

  const handleSetRecurring = (opts: {
    day?: number;
    time?: string;
    startDate?: Date;
    endDate?: Date;
    sessionIds?: string[];
  }) => {
    if (opts.day !== undefined) setRecurringDay(opts.day);
    if (opts.time !== undefined) setRecurringTime(opts.time);
    if (opts.startDate !== undefined) setRecurringStartDate(opts.startDate);
    if (opts.endDate !== undefined) setRecurringEndDate(opts.endDate);
    if (opts.sessionIds !== undefined) setSelectedRecurringSessions(opts.sessionIds);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Date Select Step Test</h1>
          <p className="text-muted-foreground">
            Test the date/time selection component for the booking wizard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-lg border p-6">
              <DateSelectStep
                sessionType={sessionType}
                instructorId={instructorId}
                selectedSessionId={selectedSessionId}
                recurringDay={recurringDay}
                recurringTime={recurringTime}
                recurringStartDate={recurringStartDate}
                recurringEndDate={recurringEndDate}
                selectedRecurringSessions={selectedRecurringSessions}
                onSelectSession={setSelectedSessionId}
                onSetRecurring={handleSetRecurring}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Test Controls</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Session Type</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionType('single')}
                    className={`px-3 py-1.5 text-sm rounded-md ${sessionType === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Single Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('recurring')}
                    className={`px-3 py-1.5 text-sm rounded-md ${sessionType === 'recurring' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Recurring Weekly
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor ID</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInstructorId(null)}
                    className={`px-3 py-1.5 text-sm rounded-md ${instructorId === null ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Any Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstructorId('test-instructor-id')}
                    className={`px-3 py-1.5 text-sm rounded-md ${instructorId === 'test-instructor-id' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Specific Instructor
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Component State</h3>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Session Type</h4>
                  <div className="p-2 rounded-md bg-muted">
                    <code className="text-sm">{sessionType}</code>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Selected Session ID</h4>
                  <div className="p-2 rounded-md bg-muted">
                    <code className="text-sm">{selectedSessionId || 'null'}</code>
                  </div>
                </div>

                {sessionType === 'recurring' && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Recurring Day</h4>
                      <div className="p-2 rounded-md bg-muted">
                        <code className="text-sm">{recurringDay !== null ? recurringDay : 'null'}</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Recurring Time</h4>
                      <div className="p-2 rounded-md bg-muted">
                        <code className="text-sm">{recurringTime || 'null'}</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Recurring Start Date</h4>
                      <div className="p-2 rounded-md bg-muted">
                        <code className="text-sm">
                          {recurringStartDate ? recurringStartDate.toDateString() : 'null'}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Recurring End Date</h4>
                      <div className="p-2 rounded-md bg-muted">
                        <code className="text-sm">
                          {recurringEndDate ? recurringEndDate.toDateString() : 'null'}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Selected Recurring Sessions</h4>
                      <div className="p-2 rounded-md bg-muted">
                        <code className="text-sm">
                          {selectedRecurringSessions.length} session(s) selected
                        </code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Component Props</h3>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">sessionType</h4>
                  <p className="text-sm text-muted-foreground">
                    &apos;single&apos; | &apos;recurring&apos; - determines which mode to display
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">instructorId</h4>
                  <p className="text-sm text-muted-foreground">
                    string | null - filters sessions by specific instructor
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">selectedSessionId</h4>
                  <p className="text-sm text-muted-foreground">
                    string | null - currently selected session ID (single mode)
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">recurringDay, recurringTime, etc.</h4>
                  <p className="text-sm text-muted-foreground">
                    State for recurring session configuration
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">onSelectSession</h4>
                  <p className="text-sm text-muted-foreground">
                    Callback when user selects a session (single mode)
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">onSetRecurring</h4>
                  <p className="text-sm text-muted-foreground">
                    Callback when user updates recurring session options
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}