'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, CheckCircle, Clock as ClockIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SessionCardProps {
  session: {
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
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const startTime = parseISO(session.startTime);
  const endTime = parseISO(session.endTime);
  const hasProgressNote = !!session.progressNote;
  const isCompleted = session.sessionStatus === 'completed';

  const getStatusBadge = () => {
    if (hasProgressNote) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Note Complete
        </Badge>
      );
    } else if (isCompleted) {
      return (
        <Badge variant="outline" className="border-amber-200 text-amber-700">
          <ClockIcon className="h-3 w-3 mr-1" />
          Needs Note
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          Upcoming
        </Badge>
      );
    }
  };

  const getLevelBadge = () => {
    const colorMap: Record<string, string> = {
      white: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
    };

    const levelColor = session.swimmer.currentLevelName?.toLowerCase() || 'white';
    const badgeClass = colorMap[levelColor] || 'bg-gray-100 text-gray-800';

    return (
      <Badge variant="outline" className={cn('font-medium', badgeClass)}>
        {session.swimmer.currentLevelName || 'White'}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-md',
      hasProgressNote ? 'border-green-200' : 'border-gray-200'
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {session.swimmer.firstName} {session.swimmer.lastName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge()}
              {getLevelBadge()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(startTime, 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, 'EEEE')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{session.location}</span>
          </div>
        </div>

        {hasProgressNote && session.progressNote && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">Progress Note Complete</p>
                <p className="text-xs text-green-700 line-clamp-2">
                  {session.progressNote.lessonSummary || 'No summary provided'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                    {session.progressNote.sharedWithParent ? 'Shared with parent' : 'Not shared'}
                  </Badge>
                  <span className="text-xs text-green-600">
                    {format(parseISO(session.progressNote.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasProgressNote && isCompleted && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Progress Note Required</p>
                <p className="text-xs text-amber-700">
                  Please complete the progress note for this completed session.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t">
        <div className="flex justify-between w-full">
          <div className="text-xs text-muted-foreground">
            Booking: {session.bookingStatus}
          </div>
          <div className="flex gap-2">
            {hasProgressNote ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/instructor/progress/${session.id}?booking=${session.bookingId}`}>
                    View Note
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/instructor/progress/${session.id}?booking=${session.bookingId}&edit=true`}>
                    Edit
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href={`/instructor/progress/${session.id}?booking=${session.bookingId}`}>
                  {isCompleted ? 'Add Progress Note' : 'Prepare Note'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}