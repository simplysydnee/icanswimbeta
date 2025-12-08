'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Calendar, FilterX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDraftSessions, useOpenSessions, useDeleteSessions } from '@/hooks';
import { BatchCard } from './BatchCard';

export function DraftSessionsManager() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useDraftSessions();
  const { mutate: openSessions, isPending: isOpening } = useOpenSessions();
  const { mutate: deleteSessions, isPending: isDeleting } = useDeleteSessions();

  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  // Calculate total sessions across all batches
  const totalSessions = useMemo(() => {
    if (!data?.batches) return 0;
    return data.batches.reduce((sum, batch) => sum + batch.session_count, 0);
  }, [data]);

  // Get all session IDs across all batches
  const allSessionIds = useMemo(() => {
    if (!data?.batches) return new Set<string>();
    const ids = new Set<string>();
    data.batches.forEach(batch => {
      batch.sessions.forEach(session => ids.add(session.id));
    });
    return ids;
  }, [data]);

  // Check if all sessions are selected
  const allSelected = useMemo(() => {
    if (allSessionIds.size === 0) return false;
    return selectedSessionIds.size === allSessionIds.size;
  }, [selectedSessionIds, allSessionIds]);

  // Check if some sessions are selected (but not all)
  // someSelected is kept for potential future use
  // const someSelected = useMemo(() => {
  //   return selectedSessionIds.size > 0 && selectedSessionIds.size < allSessionIds.size;
  // }, [selectedSessionIds, allSessionIds]);

  const handleSelectSession = useCallback((sessionId: string, selected: boolean) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  }, []);

  const handleSelectBatch = useCallback((batchId: string, selected: boolean) => {
    const batch = data?.batches.find(b => b.batch_id === batchId);
    if (!batch) return;

    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      const batchSessionIds = new Set(batch.sessions.map(s => s.id));

      if (selected) {
        // Add all session IDs from this batch
        batchSessionIds.forEach(id => next.add(id));
      } else {
        // Remove all session IDs from this batch
        batchSessionIds.forEach(id => next.delete(id));
      }
      return next;
    });
  }, [data]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      // Clear selection
      setSelectedSessionIds(new Set());
    } else {
      // Select all
      setSelectedSessionIds(new Set(allSessionIds));
    }
  }, [allSelected, allSessionIds]);

  const handleOpenSelected = useCallback(() => {
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
  }, [selectedSessionIds, openSessions, toast, refetch]);

  const handleDeleteSelected = useCallback(() => {
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
  }, [selectedSessionIds, deleteSessions, toast, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading draft sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load draft sessions: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.batches || data.batches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No draft sessions found</h3>
            <p className="text-muted-foreground mb-4">
              Create draft sessions using the Session Generator to manage them here.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Draft Sessions Manager</CardTitle>
            <CardDescription>
              Manage draft sessions before making them available for booking
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedSessionIds.size} of {totalSessions} selected
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Selection Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all draft sessions"
            />
            <span className="text-sm font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
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

        {/* Batch Cards */}
        <div className="space-y-4">
          {data.batches.map((batch) => (
            <BatchCard
              key={batch.batch_id}
              batch={batch}
              selectedIds={selectedSessionIds}
              onSelectSession={handleSelectSession}
              onSelectBatch={handleSelectBatch}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {data.batches.length} batch{data.batches.length !== 1 ? 'es' : ''} with {totalSessions} total session{totalSessions !== 1 ? 's' : ''}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}