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
  DollarSign,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
  CreditCard,
  CheckCircle,
  UserPlus,
  CalendarPlus,
  Mail,
  Settings,
  LayoutDashboard,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import NeedsProgressUpdateCard from '@/components/dashboard/NeedsProgressUpdateCard';

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
      // Fetch swimmers data
      const { data: swimmers } = await supabase
        .from('swimmers')
        .select('id, enrollment_status, payment_type, funding_source_id');

      // Fetch pending purchase orders
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('id')
        .in('status', ['pending', 'approved_pending_auth']);

      // Fetch sessions for today with progress_notes check
      const startOfToday = startOfDay(new Date()).toISOString();
      const endOfToday = endOfDay(new Date()).toISOString();

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
        .gte('start_time', startOfToday)
        .lte('start_time', endOfToday)
        .order('start_time');

      const swimmerList = swimmers || [];

      // Calculate stats based on actual schema
      const activeSwimmers = swimmerList.filter(s => s.enrollment_status === 'enrolled').length;
      const waitlistedSwimmers = swimmerList.filter(s => s.enrollment_status === 'waitlist').length;
      const privatePayCount = swimmerList.filter(s => s.payment_type === 'private_pay').length;
      // Funded includes funded, scholarship, and other payment types
      const fundedCount = swimmerList.filter(s =>
        s.payment_type === 'funded' ||
        s.payment_type === 'scholarship' ||
        s.payment_type === 'other'
      ).length;

      // Calculate sessions needing progress updates
      const sessionsNeedingProgress = sessions?.filter(s => {
        const sessionTime = new Date(s.start_time);
        const now = new Date();
        const isPastOrCurrent = sessionTime <= now;
        const hasProgressNote = s.progress_notes && s.progress_notes.length > 0;
        return isPastOrCurrent && !hasProgressNote && s.bookings?.length > 0;
      }).length || 0;

      // Get revenue this month from bookings
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data: revenueBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          swimmer:swimmers(payment_type),
          session:sessions(price_cents)
        `)
        .gte('created_at', startOfMonth)
        .in('status', ['confirmed', 'completed']);

      let privatePayRevenue = 0;
      let fundedRevenue = 0;

      revenueBookings?.forEach(booking => {
        const price = booking.session?.price_cents || 7500; // Default $75
        if (booking.swimmer?.payment_type === 'private_pay') {
          privatePayRevenue += price;
        } else {
          fundedRevenue += price;
        }
      });

      setTodaysSessions(sessions || []);
      setStats({
        totalSwimmers: swimmerList.length,
        activeSwimmers,
        waitlistedSwimmers,
        privatePayCount,
        fundedCount,
        sessionsToday: sessions?.length || 0,
        pendingReferrals: 0, // Placeholder - referral_requests table might not exist
        pendingPOs: pos?.length || 0,
        sessionsNeedingProgress,
        privatePayRevenue,
        fundedRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      <div className="container mx-auto p-6 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
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

        {/* Quick actions skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="font-medium">{format(new Date(), 'EEEE')}</div>
          <div>{format(new Date(), 'MMMM d, yyyy')}</div>
        </div>
      </div>

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Swimmers - Links to Swimmer Management */}
        <Link href="/admin/swimmers" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-cyan-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Swimmers</p>
                  <p className="text-3xl font-bold">{stats?.activeSwimmers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalSwimmers} total • {stats?.waitlistedSwimmers} waitlisted
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Sessions Today - Links to Schedule */}
        <Link href="/admin/schedule" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Today</p>
                  <p className="text-3xl font-bold">{stats?.sessionsToday || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled lessons</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Items - Links to Referrals */}
        <Link href="/admin/referrals" className="block">
          <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${pendingCount > 0 ? 'border-orange-300 bg-orange-50 hover:border-orange-400' : 'hover:border-gray-300'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingReferrals} referrals • {stats?.pendingPOs} POs • {stats?.sessionsNeedingProgress} progress updates
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${pendingCount > 0 ? 'bg-orange-200' : 'bg-gray-100'}`}>
                  <AlertCircle className={`h-6 w-6 ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Waitlisted - Links to Swimmer Management */}
        <Link href="/admin/swimmers" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waitlisted</p>
                  <p className="text-3xl font-bold">{stats?.waitlistedSwimmers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pending enrollment
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Private Pay Revenue</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(stats?.privatePayRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funded (Billed)</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats?.fundedRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Combined</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency((stats?.privatePayRevenue || 0) + (stats?.fundedRevenue || 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

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
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/admin/swimmers" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Users className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Swimmer Management</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/schedule" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Calendar className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Schedule Management</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/sessions/generate" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <CalendarPlus className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Session Generator</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/referrals" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <FileText className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Funding Referrals</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/bookings" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <ClipboardList className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Bookings</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/pos" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <FileText className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Purchase Orders</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <UserCog className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">User Management</div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/settings" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Settings className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Settings</div>
                </div>
              </Button>
            </Link>
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
                  <div className="flex items-center gap-2">
                    {needsProgressUpdate ? (
                      <Link href={`/instructor/progress/${session.id}`}>
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                          <FileText className="h-4 w-4 mr-1" />
                          Update Progress
                        </Button>
                      </Link>
                    ) : hasProgressNote ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Updated
                      </Badge>
                    ) : (
                      <Badge variant="outline">{session.location || 'TBD'}</Badge>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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