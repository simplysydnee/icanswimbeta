'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Calendar, FilterX, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDraftSessions, useOpenSessions, useDeleteSessions } from '@/hooks';
import { format } from 'date-fns';

function AdminSessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const statusFilter = searchParams.get('status') || 'all';

  const { data, isLoading, error, refetch } = useDraftSessions();
  const { mutate: openSessions, isPending: isOpening } = useOpenSessions();
  const { mutate: deleteSessions, isPending: isDeleting } = useDeleteSessions();

  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  // Filter sessions based on status
  const filteredSessions = useMemo(() => {
    if (!data?.batches) return [];

    const allSessions: any[] = [];
    data.batches.forEach(batch => {
      batch.sessions.forEach(session => {
        allSessions.push({ ...session, batch_id: batch.batch_id });
      });
    });

    if (statusFilter === 'all') return allSessions;
    if (statusFilter === 'draft') return allSessions.filter(s => s.status === 'draft');
    if (statusFilter === 'open') return allSessions.filter(s => s.status === 'open');
    if (statusFilter === 'booked') return allSessions.filter(s => s.status === 'booked');
    if (statusFilter === 'completed') return allSessions.filter(s => s.status === 'completed');

    return allSessions;
  }, [data, statusFilter]);

  // Calculate totals
  const totalSessions = useMemo(() => {
    if (!data?.batches) return 0;
    return data.batches.reduce((sum, batch) => sum + batch.session_count, 0);
  }, [data]);

  const draftCount = useMemo(() => {
    if (!data?.batches) return 0;
    let count = 0;
    data.batches.forEach(batch => {
      count += batch.sessions.filter(s => s.status === 'draft').length;
    });
    return count;
  }, [data]);

  const openCount = useMemo(() => {
    if (!data?.batches) return 0;
    let count = 0;
    data.batches.forEach(batch => {
      count += batch.sessions.filter(s => s.status === 'open').length;
    });
    return count;
  }, [data]);

  const bookedCount = useMemo(() => {
    if (!data?.batches) return 0;
    let count = 0;
    data.batches.forEach(batch => {
      count += batch.sessions.filter(s => s.status === 'booked').length;
    });
    return count;
  }, [data]);

  const completedCount = useMemo(() => {
    if (!data?.batches) return 0;
    let count = 0;
    data.batches.forEach(batch => {
      count += batch.sessions.filter(s => s.status === 'completed').length;
    });
    return count;
  }, [data]);

  const handleSelectSession = (sessionId: string, selected: boolean) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.size === filteredSessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const handleOpenSelected = () => {
    if (selectedSessionIds.size === 0) {
      toast({
        title: 'No sessions selected',
        description: 'Please select at least one session to open.',
        variant: 'destructive',
      });
      return;
    }

    openSessions(
      { sessionIds: Array.from(selectedSessionIds) },
      {
        onSuccess: (result) => {
          toast({
            title: 'Sessions opened successfully',
            description: `${result.count} session${result.count !== 1 ? 's' : ''} are now available for booking.`,
          });
          setSelectedSessionIds(new Set());
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Failed to open sessions',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteSelected = () => {
    if (selectedSessionIds.size === 0) {
      toast({
        title: 'No sessions selected',
        description: 'Please select at least one session to delete.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSessionIds.size} draft session${selectedSessionIds.size !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    deleteSessions(
      { sessionIds: Array.from(selectedSessionIds) },
      {
        onSuccess: (result) => {
          toast({
            title: 'Sessions deleted successfully',
            description: `${result.count} draft session${result.count !== 1 ? 's' : ''} have been deleted.`,
          });
          setSelectedSessionIds(new Set());
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Failed to delete sessions',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    router.push(`/admin/sessions?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sessions...</span>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load sessions: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Session Management</h1>
            <p className="text-muted-foreground">
              View and manage all sessions
            </p>
          </div>

          <Button onClick={() => router.push('/admin/sessions/generate')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Sessions
          </Button>
        </div>

        {/* Status Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={statusFilter} onValueChange={handleStatusChange}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all" className="flex flex-col items-center gap-1">
                  <span>All</span>
                  <Badge variant="secondary" className="text-xs">{totalSessions}</Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="flex flex-col items-center gap-1">
                  <span>Drafts</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">{draftCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="open" className="flex flex-col items-center gap-1">
                  <span>Open</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">{openCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="booked" className="flex flex-col items-center gap-1">
                  <span>Booked</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">{bookedCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex flex-col items-center gap-1">
                  <span>Completed</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">{completedCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Session List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>
                  {statusFilter === 'all' && 'All Sessions'}
                  {statusFilter === 'draft' && 'Draft Sessions'}
                  {statusFilter === 'open' && 'Open Sessions'}
                  {statusFilter === 'booked' && 'Booked Sessions'}
                  {statusFilter === 'completed' && 'Completed Sessions'}
                </CardTitle>
                <CardDescription>
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSessionIds.size} of {filteredSessions.length} selected
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Bulk Actions for Drafts */}
            {statusFilter === 'draft' && filteredSessions.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSessionIds.size === filteredSessions.length && filteredSessions.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all sessions"
                  />
                  <span className="text-sm font-medium">
                    {selectedSessionIds.size === filteredSessions.length ? 'Deselect All' : 'Select All'}
                  </span>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleOpenSelected}
                    disabled={selectedSessionIds.size === 0 || isOpening}
                    className="gap-2"
                  >
                    {isOpening && <Loader2 className="h-4 w-4 animate-spin" />}
                    Open Selected ({selectedSessionIds.size})
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={selectedSessionIds.size === 0 || isDeleting}
                    className="gap-2"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete Selected ({selectedSessionIds.size})
                  </Button>

                  {selectedSessionIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSessionIds(new Set())}
                      className="gap-2"
                    >
                      <FilterX className="h-4 w-4" />
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'draft'
                    ? 'No draft sessions found. Generate sessions to create drafts.'
                    : `No ${statusFilter} sessions found.`}
                </p>
                {statusFilter === 'draft' && (
                  <Button onClick={() => router.push('/admin/sessions/generate')}>
                    Generate Sessions
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedSessionIds.has(session.id)}
                      onCheckedChange={(checked) => handleSelectSession(session.id, !!checked)}
                      aria-label={`Select session ${session.id}`}
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium">
                          {format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                        </span>
                        <Badge variant="outline">{session.location}</Badge>

                        {/* Status Badge */}
                        {session.status === 'draft' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            Draft
                          </Badge>
                        )}
                        {session.status === 'open' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            Open
                          </Badge>
                        )}
                        {session.status === 'booked' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Booked
                          </Badge>
                        )}
                        {session.status === 'completed' && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                            Completed
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span>Instructor: {session.instructor_name || 'Unknown'}</span>
                        <span className="mx-2">•</span>
                        <span>Capacity: {session.booking_count || 0}/{session.max_capacity}</span>
                        <span className="mx-2">•</span>
                        <span>Type: {session.session_type}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {session.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openSessions(
                                { sessionIds: [session.id] },
                                {
                                  onSuccess: () => {
                                    toast({
                                      title: 'Session opened',
                                      description: 'Session is now available for booking.',
                                    });
                                    refetch();
                                  },
                                }
                              );
                            }}
                            disabled={isOpening}
                          >
                            Open for Booking
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this draft session?')) {
                                deleteSessions(
                                  { sessionIds: [session.id] },
                                  {
                                    onSuccess: () => {
                                      toast({
                                        title: 'Session deleted',
                                        description: 'Draft session has been deleted.',
                                      });
                                      refetch();
                                    },
                                  }
                                );
                              }
                            }}
                            disabled={isDeleting}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {session.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/schedule?date=${format(new Date(session.start_time), 'yyyy-MM-dd')}`)}
                        >
                          View in Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

export default function AdminSessionsPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sessions...</span>
        </div>
      </div>
    }>
      <AdminSessionsContent />
    </Suspense>
  );
}