'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  bookings: Array<{
    id: string;
    status: string;
    swimmer: {
      id: string;
      first_name: string;
      last_name: string;
      photo_url?: string;
      has_allergies?: boolean;
      has_medical_conditions?: boolean;
    };
  }>;
  progress_notes: Array<{ id: string }>;
}

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [todaysSessions, setTodaysSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({
    sessionsToday: 0,
    swimmersToday: 0,
    needsProgressUpdate: 0,
    completedThisWeek: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    setUserName(profile?.full_name?.split(' ')[0] || 'Instructor');

    // Get today's sessions for this instructor
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        location,
        status,
        bookings(
          id,
          status,
          swimmer:swimmers(
            id,
            first_name,
            last_name,
            photo_url,
            has_allergies,
            has_medical_conditions
          )
        ),
        progress_notes(id)
      `)
      .eq('instructor_id', user.id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time');

    const todaySessions = sessions || [];
    setTodaysSessions(todaySessions);

    // Calculate stats
    const swimmersToday = todaySessions.reduce((acc, s) =>
      acc + (s.bookings?.filter(b => b.status === 'confirmed').length || 0), 0
    );

    const needsProgressUpdate = todaySessions.filter(s => {
      const sessionTime = new Date(s.start_time);
      const now = new Date();
      const isPast = sessionTime < now;
      const hasProgress = s.progress_notes && s.progress_notes.length > 0;
      const hasBookings = s.bookings && s.bookings.filter(b => b.status === 'confirmed').length > 0;
      return isPast && !hasProgress && hasBookings;
    }).length;

    // Get completed sessions this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: completedCount } = await supabase
      .from('progress_notes')
      .select('id', { count: 'exact' })
      .eq('instructor_id', user.id)
      .gte('created_at', startOfWeek.toISOString());

    setStats({
      sessionsToday: todaySessions.length,
      swimmersToday,
      needsProgressUpdate,
      completedThisWeek: completedCount || 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schedule skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Today</p>
                <p className="text-3xl font-bold mt-1">{stats.sessionsToday}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Swimmers Today</p>
                <p className="text-3xl font-bold mt-1">{stats.swimmersToday}</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Users className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.needsProgressUpdate > 0 ? 'bg-orange-50 border-orange-200' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Needs Progress Update</p>
                <p className="text-3xl font-bold mt-1">{stats.needsProgressUpdate}</p>
              </div>
              <div className={`p-3 rounded-full ${stats.needsProgressUpdate > 0 ? 'bg-orange-200' : 'bg-gray-100'}`}>
                <AlertCircle className={`h-6 w-6 ${stats.needsProgressUpdate > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Completed This Week</p>
                <p className="text-3xl font-bold mt-1">{stats.completedThisWeek}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Today's Schedule
          </CardTitle>
          <Link href="/instructor/schedule">
            <Button variant="ghost" size="sm">
              View Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todaysSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No sessions scheduled today</p>
              <p className="text-sm text-muted-foreground">Enjoy your day off!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysSessions.map((session) => {
                const sessionTime = new Date(session.start_time);
                const now = new Date();
                const isPast = sessionTime < now;
                const hasProgress = session.progress_notes && session.progress_notes.length > 0;
                const confirmedBookings = session.bookings?.filter(b => b.status === 'confirmed') || [];
                const needsUpdate = isPast && !hasProgress && confirmedBookings.length > 0;

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      needsUpdate ? 'bg-orange-50 border-orange-200' :
                      hasProgress ? 'bg-green-50 border-green-200' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          needsUpdate ? 'bg-orange-200' :
                          hasProgress ? 'bg-green-200' :
                          'bg-blue-100'
                        }`}>
                          <Clock className={`h-5 w-5 ${
                            needsUpdate ? 'text-orange-700' :
                            hasProgress ? 'text-green-700' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                          </p>
                          <p className="text-sm text-muted-foreground">{session.location || 'Location TBD'}</p>

                          {/* Swimmers */}
                          {confirmedBookings.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {confirmedBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center gap-2">
                                  {booking.swimmer.photo_url ? (
                                    <Image
                                      src={booking.swimmer.photo_url}
                                      alt={booking.swimmer.first_name}
                                      width={32}
                                      height={32}
                                      className="rounded-full object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-medium text-cyan-700">
                                      {booking.swimmer.first_name?.[0]}{booking.swimmer.last_name?.[0]}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">
                                      {booking.swimmer.first_name} {booking.swimmer.last_name}
                                    </p>
                                    {(booking.swimmer.has_allergies || booking.swimmer.has_medical_conditions) && (
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Medical Alert
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasProgress ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : needsUpdate ? (
                          <Link href={`/instructor/progress/${session.id}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                              <FileText className="h-4 w-4 mr-1" />
                              Update Progress
                            </Button>
                          </Link>
                        ) : (
                          <Badge variant="outline">Upcoming</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/instructor/schedule">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>View Schedule</span>
              </Button>
            </Link>
            <Link href="/instructor/swimmers">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>My Swimmers</span>
              </Button>
            </Link>
            <Link href="/instructor/progress">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Progress Notes</span>
              </Button>
            </Link>
            <Link href="/instructor/timecard">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span>Timecard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}