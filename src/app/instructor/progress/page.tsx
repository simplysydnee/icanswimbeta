'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, Filter, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionCard } from '@/components/instructor/SessionCard';

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  location: string;
  sessionStatus: string;
  bookingId: string;
  bookingStatus: string;
  swimmer: {
    id: string;
    firstName: string;
    lastName: string;
    currentLevelId: string;
    currentLevelName: string;
    levelColor: string;
  };
  progressNote: {
    id: string;
    lessonSummary: string;
    sharedWithParent: boolean;
    createdAt: string;
  } | null;
}

export default function InstructorProgressPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [activeTab, setActiveTab] = useState('today');

  const weekEnd = endOfWeek(currentWeekStart);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  useEffect(() => {
    fetchSessions();
  }, [currentWeekStart, activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/instructor/sessions';
      if (activeTab === 'week') {
        url += `?date=${currentWeekStart.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);

    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
    setActiveTab('today');
  };

  const sessionsWithNotes = sessions.filter(s => s.progressNote);
  const sessionsWithoutNotes = sessions.filter(s => !s.progressNote);
  const completedSessionsWithoutNotes = sessions.filter(s => !s.progressNote && s.sessionStatus === 'completed');

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Progress Notes</h1>
            <p className="text-muted-foreground mt-2">
              Document swimmer progress after each lesson
            </p>
          </div>
          <Button variant="outline" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchSessions}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{sessions.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{sessionsWithNotes.length}</div>
              <div className="text-sm text-muted-foreground">Notes Complete</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{completedSessionsWithoutNotes.length}</div>
              <div className="text-sm text-muted-foreground">Notes Required</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="today">Today&apos;s Sessions</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="pending">Pending Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Sessions Today</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any scheduled sessions for today.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-6">
          {/* Week Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                  <h3 className="font-semibold">
                    {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} this week
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 mt-6">
                {weekDays.map((day, index) => {
                  const daySessions = sessions.filter(s =>
                    format(new Date(s.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                  );
                  const hasNotes = daySessions.filter(s => s.progressNote).length;
                  const needsNotes = daySessions.filter(s => !s.progressNote && s.sessionStatus === 'completed').length;

                  return (
                    <div key={index} className="text-center">
                      <div className="font-medium text-sm mb-1">{format(day, 'EEE')}</div>
                      <div className={`
                        rounded-full w-8 h-8 flex items-center justify-center mx-auto text-sm
                        ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                        }
                      `}>
                        {format(day, 'd')}
                      </div>
                      {daySessions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <Badge variant="outline" className="text-xs w-full justify-center">
                            {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                          </Badge>
                          {hasNotes > 0 && (
                            <Badge variant="default" className="text-xs w-full justify-center bg-green-100 text-green-800">
                              {hasNotes} complete
                            </Badge>
                          )}
                          {needsNotes > 0 && (
                            <Badge variant="outline" className="text-xs w-full justify-center border-amber-200 text-amber-700">
                              {needsNotes} pending
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Sessions This Week</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any scheduled sessions for this week.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          {completedSessionsWithoutNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any pending progress notes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You have {completedSessionsWithoutNotes.length} completed session{completedSessionsWithoutNotes.length !== 1 ? 's' : ''} requiring progress notes.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {completedSessionsWithoutNotes.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Use Progress Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <span>Click on a session to add or edit progress notes</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <span>Record attendance, swimmer mood, and water comfort level</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <span>Select skills worked on and mastered during the lesson</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <span>Write a detailed lesson summary and any notes for parents</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <span>Toggle &quot;Share with Parent&quot; to make notes visible to parents</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}