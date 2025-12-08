'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Calendar, MapPin, User } from 'lucide-react';
import { BatchGroup } from '@/hooks/useDraftSessions';
import { SessionRow } from './SessionRow';

interface BatchCardProps {
  batch: BatchGroup;
  selectedIds: Set<string>;
  onSelectSession: (sessionId: string, selected: boolean) => void;
  onSelectBatch: (batchId: string, selected: boolean) => void;
}

export function BatchCard({ batch, selectedIds, onSelectSession, onSelectBatch }: BatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // formatTime is kept for potential future use
  // const formatTime = (isoString: string) => {
  //   const date = new Date(isoString);
  //   return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  // };

  const getDateRange = () => {
    const start = new Date(batch.date_range.start);
    const end = new Date(batch.date_range.end);

    if (start.toDateString() === end.toDateString()) {
      return formatDate(batch.date_range.start);
    }

    return `${formatDate(batch.date_range.start)} - ${formatDate(batch.date_range.end)}`;
  };

  const allSessionsSelected = batch.sessions.every(session => selectedIds.has(session.id));
  // someSessionsSelected is kept for potential future use
  // const someSessionsSelected = batch.sessions.some(session => selectedIds.has(session.id)) && !allSessionsSelected;

  const handleBatchSelect = (checked: boolean) => {
    onSelectBatch(batch.batch_id, checked);
  };

  const getBatchTitle = () => {
    if (batch.sessions.length === 0) {
      return 'Empty Batch';
    }

    // Get month from first session
    const firstSessionDate = new Date(batch.sessions[0].start_time);
    const month = firstSessionDate.toLocaleDateString([], { month: 'long' });

    // Check if all sessions are on the same day of week
    const daysOfWeek = new Set<number>();
    batch.sessions.forEach(session => {
      const date = new Date(session.start_time);
      daysOfWeek.add(date.getDay());
    });

    let dayLabel = 'Mixed';
    if (daysOfWeek.size === 1) {
      const dayNumber = Array.from(daysOfWeek)[0];
      const dayName = firstSessionDate.toLocaleDateString([], { weekday: 'long' });
      dayLabel = `${dayName}s`; // Pluralize
    }

    // Get instructor name
    const instructorName = batch.instructor.name.split(' ')[0]; // First name only

    return `${month} - ${dayLabel} - ${instructorName}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={allSessionsSelected}
              onCheckedChange={handleBatchSelect}
              aria-label={`Select all sessions in batch ${batch.batch_id}`}
            />

            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getBatchTitle()}
                <Badge variant="secondary" className="ml-2">
                  {batch.session_count} session{batch.session_count !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>

              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(batch.created_at)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{batch.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Instructor: {batch.instructor.name}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t">
          <div className="mt-4 space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Date Range: {getDateRange()}
            </div>

            <div className="space-y-2">
              {batch.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selected={selectedIds.has(session.id)}
                  onSelect={onSelectSession}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}