'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, FileText, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import CompactQuickActions from './CompactQuickActions';

interface SwimmerNeedingUpdate {
  id: string;
  session_id: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    current_level?: {
      name: string;
      display_name: string;
    };
  };
  session: {
    id: string;
    start_time: string;
    end_time: string;
    instructor?: {
      full_name: string;
    };
  };
}

interface NeedsProgressUpdateCardProps {
  className?: string;
}

export default function NeedsProgressUpdateCard({ className }: NeedsProgressUpdateCardProps) {
  const [swimmers, setSwimmers] = useState<SwimmerNeedingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSwimmersNeedingUpdate = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch('/api/swimmers/needs-progress-update', { signal });
      if (!response.ok) {
        // API endpoint not available - show empty state
        console.warn('Progress update API not available, status:', response.status, response.statusText);
        const errorText = await response.text().catch(() => '');
        console.warn('API error response:', errorText);
        setSwimmers([]);
        return;
      }
      const data = await response.json();
      console.log('Progress update API response:', data.length, 'items');
      setSwimmers(data);
    } catch (error) {
      // Only log error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Error fetching swimmers needing update:', error.message);
      }
      // Set empty array to show "no swimmers" state
      setSwimmers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    fetchSwimmersNeedingUpdate(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchSwimmersNeedingUpdate]);

  const handleUpdateProgress = (swimmer: SwimmerNeedingUpdate) => {
    // Navigate to the staff mode swimmer page instead of opening a modal
    window.location.href = `/staff-mode/swimmer/${swimmer.swimmer.id}`;
  };

  const handleProgressSubmitted = () => {
    // Refresh the list after a quick action is submitted
    fetchSwimmersNeedingUpdate();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Needs Progress Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (swimmers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Progress Updates Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-muted-foreground">All progress updates are complete for today!</p>
            <p className="text-sm text-muted-foreground mt-1">Great work!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Needs Progress Update
            <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-300">
              {swimmers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {swimmers.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                {item.swimmer.photo_url ? (
                  <Image
                    src={item.swimmer.photo_url}
                    alt={`${item.swimmer.first_name} ${item.swimmer.last_name}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-cyan-100 text-cyan-700">
                      {item.swimmer.first_name?.[0]}{item.swimmer.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="font-medium">
                    {item.swimmer.first_name} {item.swimmer.last_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(item.session.start_time), 'h:mm a')}</span>
                    {item.swimmer.current_level && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {item.swimmer.current_level.display_name || item.swimmer.current_level.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CompactQuickActions
                  bookingId={item.id}
                  sessionId={item.session_id}
                  swimmerId={item.swimmer.id}
                  swimmerName={`${item.swimmer.first_name} ${item.swimmer.last_name}`}
                  onSuccess={handleProgressSubmitted}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-100"
                  onClick={() => handleUpdateProgress(item)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Detailed Update
                </Button>
              </div>
            </div>
          ))}
          {swimmers.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                View all {swimmers.length} swimmers
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}