'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProgressNoteForm } from '@/components/instructor/ProgressNoteForm';

export default function SessionProgressPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const bookingId = searchParams.get('booking') as string;
  const editMode = searchParams.get('edit') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [existingNote, setExistingNote] = useState<any>(null);

  useEffect(() => {
    if (sessionId && bookingId) {
      fetchSessionData();
    }
  }, [sessionId, bookingId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch session details
      const sessionResponse = await fetch(`/api/instructor/sessions?date=${new Date().toISOString()}`);
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session data');
      }

      const sessionData = await sessionResponse.json();
      const currentSession = sessionData.sessions.find((s: any) => s.id === sessionId && s.bookingId === bookingId);

      if (!currentSession) {
        throw new Error('Session not found');
      }

      setSessionData({
        startTime: currentSession.startTime,
        endTime: currentSession.endTime,
        location: currentSession.location,
        swimmer: currentSession.swimmer,
      });

      // Fetch existing progress note if it exists
      if (currentSession.progressNote) {
        const noteResponse = await fetch(`/api/progress-notes?bookingId=${bookingId}`);
        if (noteResponse.ok) {
          const notes = await noteResponse.json();
          if (notes.length > 0) {
            setExistingNote(notes[0]);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading session data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/instructor/progress">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Session data not found</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/instructor/progress">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/instructor/progress">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {existingNote && !editMode ? 'View Progress Note' : 'Create Progress Note'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {existingNote && !editMode
                ? 'Review progress note details'
                : 'Document swimmer progress for this session'}
            </p>
          </div>

          {existingNote && !editMode && (
            <Button asChild>
              <Link href={`?booking=${bookingId}&edit=true`}>
                Edit Note
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Note Form */}
      <ProgressNoteForm
        sessionId={sessionId}
        bookingId={bookingId}
        swimmerId={sessionData.swimmer.id}
        sessionData={sessionData}
        existingNote={editMode ? existingNote : undefined}
      />

      {/* Help Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tips for Effective Progress Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium">• Be Specific:</span>
              <span>Describe exactly what skills were worked on and how the swimmer responded</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">• Note Progress:</span>
              <span>Highlight improvements, even small ones, to show growth over time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">• Set Goals:</span>
              <span>Mention what to focus on in the next session</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">• Parent Communication:</span>
              <span>Use parent notes to share positive feedback and suggestions for practice at home</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">• Skill Tracking:</span>
              <span>Accurately mark skills as &quot;Working On&quot; or &quot;Mastered&quot; to track progression through levels</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}