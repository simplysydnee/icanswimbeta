'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  AlertCircle,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  Building2,
  CreditCard,
  CheckCircle,
  CalendarPlus,
  Settings,
  LayoutDashboard,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format, addDays, startOfMonth } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import NeedsProgressUpdateCard from '@/components/dashboard/NeedsProgressUpdateCard';
import { ToDoWidget } from '@/components/dashboard/ToDoWidget';

// Funding source UUIDs (from database)
const PRIVATE_PAY_FUNDING_SOURCE_ID = '5be04fb2-39e9-4764-8cd8-2ab03ad491b6';
const VMRC_FUNDING_SOURCE_ID = 'de392da6-2f26-46a8-9fc1-075e8e973d61';

interface DashboardStats {
  totalSwimmers: number;
  activeSwimmers: number;
  waitlistedSwimmers: number;
  privatePayCount: number;
  fundedCount: number;
  sessionsToday: number;
  pendingReferrals: number;
  pendingPOs: number;
  sessionsNeedingProgress: number;
  privatePayRevenue: number;
  fundedRevenue: number;
}

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  instructor: {
    full_name: string | null;
  } | null;
  bookings: Array<{
    id: string;
    swimmer: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
  }> | null;
  progress_notes: Array<{ id: string }> | null;
}

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Use count queries instead of fetching all records
      const { count: totalSwimmers, error: totalError } = await supabase
        .from('swimmers')
        .select('*', { count: 'exact', head: true });

      const { count: activeSwimmers, error: activeError } = await supabase
        .from('swimmers')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_status', 'enrolled');

      const { count: waitlistedSwimmers, error: waitlistError } = await supabase
        .from('swimmers')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_status', 'waitlist');

      const { count: privatePayCount, error: privateError } = await supabase
        .from('swimmers')
        .select('*', { count: 'exact', head: true })
        .eq('funding_source_id', PRIVATE_PAY_FUNDING_SOURCE_ID);

      const { count: fundedCount, error: fundedError } = await supabase
        .from('swimmers')
        .select('*', { count: 'exact', head: true })
        .not('funding_source_id', 'is', null)
        .neq('funding_source_id', PRIVATE_PAY_FUNDING_SOURCE_ID);

      // Fetch pending purchase orders
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('id')
        .in('status', ['pending', 'approved_pending_auth']);

      // Fetch today's sessions with timezone-aware query
      // Midnight Pacific = 8 AM UTC
      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');
      const startOfDayUTC = `${dateStr}T08:00:00.000Z`;
      const endOfDayUTC = `${format(addDays(today, 1), 'yyyy-MM-dd')}T08:00:00.000Z`;

      // Get count of sessions today
      const { count: sessionsTodayCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', startOfDayUTC)
        .lt('start_time', endOfDayUTC)
        .neq('status', 'cancelled');

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          end_time,
          location,
          status,
          instructor:profiles!instructor_id(full_name),
          bookings(
            id,
            swimmer:swimmers(id, first_name, last_name)
          ),
          progress_notes(id)
        `)
        .gte('start_time', startOfDayUTC)
        .lt('start_time', endOfDayUTC)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      // Calculate bookings needing progress updates from session data
      let bookingsNeedingProgress = 0;
      sessions?.forEach(s => {
        const sessionTime = new Date(s.start_time);
        const now = new Date();
        const isPastOrCurrent = sessionTime <= now;

        if (isPastOrCurrent && s.bookings && s.bookings.length > 0) {
          if (!s.progress_notes || s.progress_notes.length === 0) {
            bookingsNeedingProgress += s.bookings.length;
          } else if (s.progress_notes.length < s.bookings.length) {
            bookingsNeedingProgress += (s.bookings.length - s.progress_notes.length);
          }
        }
      });

      // Get revenue month-to-date from bookings
      const startOfMonthUTC = startOfMonth(new Date()).toISOString();
      const nowUTC = new Date().toISOString();

      // Fetch all completed bookings month-to-date with swimmer's funding source
      const { data: bookingsMTD } = await supabase
        .from('bookings')
        .select(`
          session:sessions(price_cents, start_time),
          swimmer:swimmers(funding_source_id, payment_type)
        `)
        .eq('status', 'completed')
        .gte('session.start_time', startOfMonthUTC)
        .lt('session.start_time', nowUTC);

      let privatePayRevenue = 0;
      let fundedRevenue = 0;

      bookingsMTD?.forEach(booking => {
        const price = booking.session?.price_cents || 9000; // Default $90
        const fundingSourceId = booking.swimmer?.funding_source_id;
        const paymentType = booking.swimmer?.payment_type;

        if (fundingSourceId === PRIVATE_PAY_FUNDING_SOURCE_ID || paymentType === 'private_pay') {
          privatePayRevenue += price;
        } else {
          // Any other funding source (including VMRC, CVRC, etc.) is considered funded
          fundedRevenue += price;
        }
      });

      setTodaysSessions(sessions || []);
      setStats({
        totalSwimmers: totalSwimmers ?? 0,
        activeSwimmers: activeSwimmers ?? 0,
        waitlistedSwimmers: waitlistedSwimmers ?? 0,
        privatePayCount: privatePayCount ?? 0,
        fundedCount: fundedCount ?? 0,
        sessionsToday: sessionsTodayCount ?? 0,
        pendingReferrals: 0, // Placeholder - referral_requests table might not exist
        pendingPOs: pos?.length ?? 0,
        sessionsNeedingProgress: bookingsNeedingProgress ?? 0,
        privatePayRevenue: privatePayRevenue ?? 0,
        fundedRevenue: fundedRevenue ?? 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateProgress = (
    bookingId: string,
    sessionId: string,
    swimmerId: string,
    swimmerName: string,
    swimmerPhotoUrl: string | undefined,
    sessionTime: string
  ) => {
    // Navigate to the staff mode swimmer page instead of opening a modal
    router.push(`/staff-mode/swimmer/${swimmerId}`);
  };

  useEffect(() => {
    if (role && role !== 'admin') {
      router.push('/dashboard');
    } else if (user) {
      fetchStats();
    }
  }, [role, user, fetchStats, router]);

  const pendingCount = (stats?.pendingReferrals || 0) + (stats?.pendingPOs || 0) + (stats?.sessionsNeedingProgress || 0);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Quick actions skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If stats is still null after loading, show error state
  if (!stats) {
    return (
      <div className="w-full px-6 py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-6">
            Unable to fetch dashboard statistics. Please try again.
          </p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName ? user.fullName.split(' ')[0] : 'Admin'}!
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={() => router.push('/staff-mode')}
            variant="outline"
            className="border-[#2a5e84] text-[#2a5e84] hover:bg-[#e8f4f8]"
          >
            <Users className="mr-2 h-4 w-4" />
            Staff Mode
          </Button>
          <div className="text-right text-sm text-muted-foreground">
            <div className="font-medium">{format(new Date(), 'EEEE')}</div>
            <div>{format(new Date(), 'MMMM d, yyyy')}</div>
          </div>
        </div>
      </div>

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Swimmers - Links to Swimmer Management */}
        <Link href="/admin/swimmers" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-cyan-300 min-h-[136px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Active Swimmers</p>
                  <p className="text-3xl font-bold">{stats?.activeSwimmers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stats?.totalSwimmers} total • {stats?.waitlistedSwimmers} waitlisted
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 ml-4">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Sessions Today - Links to Schedule */}
        <Link href="/admin/schedule" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300 min-h-[136px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Sessions Today</p>
                  <p className="text-3xl font-bold">{stats?.sessionsToday || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Scheduled lessons
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ml-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Items - Links to Referrals */}
        <Link href="/admin/referrals" className="block">
          <Card className={`cursor-pointer hover:shadow-lg transition-shadow min-h-[136px] ${pendingCount > 0 ? 'border-orange-300 bg-orange-50 hover:border-orange-400' : 'hover:border-gray-300'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Progress updates needed
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ml-4 ${pendingCount > 0 ? 'bg-orange-200' : 'bg-gray-100'}`}>
                  <AlertCircle className={`h-6 w-6 ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Waitlisted - Links to Swimmer Management */}
        <Link href="/admin/swimmers" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300 min-h-[136px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Waitlisted</p>
                  <p className="text-3xl font-bold">{stats?.waitlistedSwimmers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Pending Assessment
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 ml-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Private Pay Revenue</CardTitle>
            <p className="text-xs text-muted-foreground">Month to Date ({format(new Date(), 'MMMM yyyy')})</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(stats?.privatePayRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funded (Billed)</CardTitle>
            <p className="text-xs text-muted-foreground">Month to Date ({format(new Date(), 'MMMM yyyy')})</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats?.fundedRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Combined</CardTitle>
            <p className="text-xs text-green-600">Month to Date ({format(new Date(), 'MMMM yyyy')})</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency((stats?.privatePayRevenue || 0) + (stats?.fundedRevenue || 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* To Do Widget */}
        <ToDoWidget />

        {/* Needs Progress Update Card */}
        <NeedsProgressUpdateCard />

        {/* Quick Actions - Previously the button list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-cyan-600" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/admin/swimmers" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <Users className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Swimmer Management
                </span>
              </Button>
            </Link>

            <Link href="/admin/schedule" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <Calendar className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Schedule Management
                </span>
              </Button>
            </Link>

            <Link href="/admin/sessions/generate" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <CalendarPlus className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Session Generator
                </span>
              </Button>
            </Link>

            <Link href="/admin/referrals" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <FileText className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Funding Referrals
                </span>
              </Button>
            </Link>

            <Link href="/admin/sessions" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <ClipboardList className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Session Management
                </span>
              </Button>
            </Link>

            <Link href="/admin/pos" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <FileText className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Purchase Orders
                </span>
              </Button>
            </Link>

            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <UserCog className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  User Management
                </span>
              </Button>
            </Link>

            <Link href="/admin/settings" className="block">
              <Button variant="outline" className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5">
                <Settings className="h-5 w-5 shrink-0" />
                <span className="text-xs text-center leading-tight whitespace-normal break-words">
                  Settings
                </span>
              </Button>
            </Link>

            {/* Staff Mode Button */}
            <Button
              onClick={() => router.push('/staff-mode')}
              variant="outline"
              className="w-full h-auto min-h-[70px] py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-[#2a5e84] text-[#2a5e84] hover:bg-[#e8f4f8]"
            >
              <Users className="h-5 w-5 shrink-0" />
              <span className="text-xs text-center leading-tight whitespace-normal break-words">
                Staff Mode
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysSessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No sessions scheduled for today</p>
            </div>
          ) : (
            todaysSessions.slice(0, 5).map((session) => {
              const sessionTime = new Date(session.start_time);
              const now = new Date();
              const isPastOrCurrent = sessionTime <= now;
              const hasProgressNote = session.progress_notes && session.progress_notes.length > 0;
              const needsProgressUpdate = isPastOrCurrent && !hasProgressNote && (session.bookings?.length || 0) > 0;

              return (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${hasProgressNote ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {hasProgressNote ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(session.start_time), 'h:mm a')}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.instructor?.full_name || 'TBD'} • {session.bookings?.length || 0} swimmers
                      </p>
                      {session.bookings && session.bookings.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {session.bookings.map((b) => b.swimmer?.first_name).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasProgressNote ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 self-start">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Updated
                      </Badge>
                    ) : needsProgressUpdate ? (
                      <div className="space-y-2">
                        {session.bookings?.map((booking) => {
                          if (!booking.swimmer) return null;
                          return (
                            <Button
                              key={booking.id}
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 w-full justify-start"
                              onClick={() => handleUpdateProgress(
                                booking.id,
                                session.id,
                                booking.swimmer!.id,
                                `${booking.swimmer!.first_name} ${booking.swimmer!.last_name}`,
                                undefined, // admin page doesn't have swimmer photo_url
                                session.start_time
                              )}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Update {booking.swimmer!.first_name}'s Progress
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <Badge variant="outline" className="self-start">{session.location || 'TBD'}</Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {todaysSessions.length > 5 && (
            <div className="text-center pt-2">
              <Link href="/admin/schedule">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View all {todaysSessions.length} sessions
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swimmer Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Swimmer Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/swimmers?filter=private_pay" className="block">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Private Pay</span>
                </div>
                <p className="text-2xl font-bold text-emerald-800">{stats?.privatePayCount || 0}</p>
              </div>
            </Link>

            <Link href="/admin/swimmers?filter=funded" className="block">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Funded</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{stats?.fundedCount || 0}</p>
              </div>
            </Link>

            <Link href="/admin/swimmers?filter=enrolled" className="block">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Enrolled</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{stats?.activeSwimmers || 0}</p>
              </div>
            </Link>

            <Link href="/admin/swimmers?filter=waitlist" className="block">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Waitlisted</span>
                </div>
                <p className="text-2xl font-bold text-yellow-800">{stats?.waitlistedSwimmers || 0}</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}