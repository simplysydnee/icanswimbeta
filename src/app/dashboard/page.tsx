'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Activity,
  CheckCircle,
  UserPlus,
  CalendarPlus,
  Mail,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  // Swimmer counts
  totalSwimmers: number;
  activeSwimmers: number;
  waitlistedSwimmers: number;

  // By funding source
  privatePayCount: number;
  vmrcCount: number;
  cvrcCount: number;
  otherFundedCount: number;

  // Sessions
  sessionsToday: number;
  sessionsThisWeek: number;

  // Pending items
  pendingReferrals: number;
  pendingPOs: number;
  pendingAssessments: number;

  // Revenue
  privatePayRevenue: number;
  fundedRevenue: number;
  totalRevenue: number;

  // This month
  privatePayThisMonth: number;
  fundedThisMonth: number;
  totalThisMonth: number;
}

interface TodaySession {
  id: string;
  start_time: string;
  session_type: string;
  swimmer_name: string;
  instructor_name: string;
}

interface RecentActivity {
  id: string;
  type: 'lesson_complete' | 'referral' | 'po_approved' | 'assessment' | 'enrollment';
  message: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { user, role, isLoadingProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'admin') {
      // Redirect non-admins to appropriate dashboard
      if (role === 'parent') router.push('/parent');
      else if (role === 'instructor') router.push('/instructor');
      else if (role === 'vmrc_coordinator') router.push('/coordinator/pos');
    } else {
      fetchDashboardData();
    }
  }, [role]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch all stats in parallel
      const [
        swimmersRes,
        referralsRes,
        posRes,
        sessionsRes,
        bookingsRes
      ] = await Promise.all([
        // Swimmers with funding source
        supabase.from('swimmers').select(`
          id, enrollment_status, assessment_status,
          funding_source_id,
          funding_source:funding_sources(type, short_name)
        `),

        // Pending referrals
        supabase.from('referral_requests')
          .select('id')
          .eq('status', 'pending'),

        // Pending POs
        supabase.from('purchase_orders')
          .select('id')
          .in('status', ['pending', 'approved_pending_auth']),

        // Today's sessions
        supabase.from('sessions')
          .select(`
            id, start_time, session_type,
            bookings(swimmer:swimmers(first_name, last_name)),
            instructor:profiles!instructor_id(full_name)
          `)
          .gte('start_time', new Date().toISOString().split('T')[0])
          .lt('start_time', new Date(Date.now() + 86400000).toISOString().split('T')[0])
          .order('start_time', { ascending: true })
          .limit(6),

        // Bookings for revenue (this month)
        supabase.from('bookings')
          .select(`
            id, created_at, status,
            session:sessions(price_cents, session_type),
            swimmer:swimmers(funding_source_id, funding_source:funding_sources(type))
          `)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .in('status', ['confirmed', 'completed'])
      ]);

      // Process swimmers
      const swimmers = swimmersRes.data || [];
      const privatePaySwimmers = swimmers.filter(s => !s.funding_source_id || s.funding_source?.type === 'private_pay');
      const vmrcSwimmers = swimmers.filter(s => s.funding_source?.short_name === 'VMRC');
      const cvrcSwimmers = swimmers.filter(s => s.funding_source?.short_name === 'CVRC');
      const otherFunded = swimmers.filter(s =>
        s.funding_source_id &&
        s.funding_source?.type !== 'private_pay' &&
        !['VMRC', 'CVRC'].includes(s.funding_source?.short_name || '')
      );

      // Process revenue
      const bookings = bookingsRes.data || [];
      let privatePayRevenue = 0;
      let fundedRevenue = 0;

      bookings.forEach(booking => {
        const price = (booking.session?.price_cents || 0) / 100;
        const isPrivatePay = !booking.swimmer?.funding_source_id ||
          booking.swimmer?.funding_source?.type === 'private_pay';

        if (isPrivatePay) {
          privatePayRevenue += price;
        } else {
          fundedRevenue += price;
        }
      });

      // Process today's sessions
      const todaySessionsList: TodaySession[] = (sessionsRes.data || []).map(session => ({
        id: session.id,
        start_time: session.start_time,
        session_type: session.session_type,
        swimmer_name: session.bookings?.[0]?.swimmer
          ? `${session.bookings[0].swimmer.first_name} ${session.bookings[0].swimmer.last_name}`
          : 'Open Slot',
        instructor_name: session.instructor?.full_name || 'Unassigned'
      }));

      setStats({
        totalSwimmers: swimmers.length,
        activeSwimmers: swimmers.filter(s => s.enrollment_status === 'enrolled').length,
        waitlistedSwimmers: swimmers.filter(s => s.enrollment_status === 'waitlist').length,
        privatePayCount: privatePaySwimmers.length,
        vmrcCount: vmrcSwimmers.length,
        cvrcCount: cvrcSwimmers.length,
        otherFundedCount: otherFunded.length,
        sessionsToday: sessionsRes.data?.length || 0,
        sessionsThisWeek: 0, // TODO: Calculate
        pendingReferrals: referralsRes.data?.length || 0,
        pendingPOs: posRes.data?.length || 0,
        pendingAssessments: swimmers.filter(s => s.assessment_status === 'scheduled').length,
        privatePayRevenue: privatePayRevenue,
        fundedRevenue: fundedRevenue,
        totalRevenue: privatePayRevenue + fundedRevenue,
        privatePayThisMonth: privatePayRevenue,
        fundedThisMonth: fundedRevenue,
        totalThisMonth: privatePayRevenue + fundedRevenue
      });

      setTodaySessions(todaySessionsList);

      // Mock recent activity for now - TODO: implement activity log table
      setRecentActivity([
        { id: '1', type: 'lesson_complete', message: 'Emma L. completed lesson #8', timestamp: new Date().toISOString() },
        { id: '2', type: 'referral', message: 'New referral submitted: Marcus J.', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'po_approved', message: 'PO approved for Jake S.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const pendingCount = (stats?.pendingReferrals || 0) + (stats?.pendingPOs || 0);

  // Show loading state while profile is being fetched
  if (isLoadingProfile || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  // If not admin, show role-specific dashboard
  if (role && role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || user?.email}!
            {role && ` (${role.charAt(0).toUpperCase() + role.slice(1)})`}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Parent Dashboard */}
          {role === 'parent' && (
            <Card>
              <CardHeader>
                <CardTitle>Parent Dashboard</CardTitle>
                <CardDescription>
                  Manage your swimmers and bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/parent/book">
                    Book Now
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/parent/swimmers">
                    View Swimmers
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/schedule">
                    View Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructor Dashboard */}
          {role === 'instructor' && (
            <Card>
              <CardHeader>
                <CardTitle>Instructor Dashboard</CardTitle>
                <CardDescription>
                  Manage your lessons and students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/instructor/schedule">
                    My Schedule
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/instructor/swimmers">
                    My Swimmers
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/instructor/students">
                    My Students
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/instructor/assessments">
                    Assessments
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/instructor/settings">
                    Profile Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* VMRC Coordinator Dashboard */}
          {role === 'vmrc_coordinator' && (
            <Card>
              <CardHeader>
                <CardTitle>VMRC Coordinator Dashboard</CardTitle>
                <CardDescription>
                  Submit referrals and manage VMRC purchase orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d] text-white">
                  <Link href="/referral">
                    New Referral
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/coordinator/pos">
                    Purchase Orders
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/coordinator/billing">
                    Billing
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/coordinator/reports">
                    VMRC Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Common Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/profile">
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/settings">
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'}!
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="font-medium">{format(new Date(), 'EEEE')}</div>
          <div>{format(new Date(), 'MMMM d, yyyy')}</div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Swimmers */}
        <Card>
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

        {/* Sessions Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Today</p>
                <p className="text-3xl font-bold">{stats?.sessionsToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaySessions.filter(s => s.session_type === 'assessment').length} assessments
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card className={pendingCount > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.pendingReferrals} referrals • {stats?.pendingPOs} POs
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${pendingCount > 0 ? 'bg-orange-200' : 'bg-gray-100'}`}>
                <AlertCircle className={`h-6 w-6 ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue This Month */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue This Month</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.totalThisMonth || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Private Pay Revenue</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats?.privatePayThisMonth || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Funded (Billed)</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats?.fundedThisMonth || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Total Combined</p>
                <p className="text-2xl font-bold text-purple-800">{formatCurrency(stats?.totalThisMonth || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Action Required */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.pendingReferrals ? (
              <Link href="/admin/referrals" className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">{stats.pendingReferrals} Referrals</p>
                    <p className="text-sm text-orange-600">Awaiting review</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-orange-400" />
              </Link>
            ) : null}

            {stats?.pendingPOs ? (
              <Link href="/coordinator/pos" className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">{stats.pendingPOs} Purchase Orders</p>
                    <p className="text-sm text-yellow-600">Need approval</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-yellow-400" />
              </Link>
            ) : null}

            {stats?.pendingAssessments ? (
              <Link href="/admin/schedule" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">{stats.pendingAssessments} Assessments</p>
                    <p className="text-sm text-blue-600">Scheduled</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-blue-400" />
              </Link>
            ) : null}

            {!stats?.pendingReferrals && !stats?.pendingPOs && !stats?.pendingAssessments && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-600" />
                Today's Schedule
              </CardTitle>
              <Link href="/admin/schedule">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todaySessions.length > 0 ? (
              <div className="space-y-2">
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium w-20">
                        {formatTime(session.start_time)}
                      </div>
                      <div>
                        <p className="font-medium">{session.swimmer_name}</p>
                        <p className="text-sm text-muted-foreground">{session.instructor_name}</p>
                      </div>
                    </div>
                    <Badge variant={session.session_type === 'assessment' ? 'default' : 'secondary'}>
                      {session.session_type === 'assessment' ? 'Assessment' : 'Lesson'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sessions scheduled today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Swimmers by Funding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Private Pay</span>
                <span className="font-medium">{stats?.privatePayCount || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${((stats?.privatePayCount || 0) / (stats?.totalSwimmers || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">VMRC</span>
                <span className="font-medium">{stats?.vmrcCount || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${((stats?.vmrcCount || 0) / (stats?.totalSwimmers || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">CVRC</span>
                <span className="font-medium">{stats?.cvrcCount || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${((stats?.cvrcCount || 0) / (stats?.totalSwimmers || 1)) * 100}%` }}
                />
              </div>
            </div>

            {(stats?.otherFundedCount || 0) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Other</span>
                  <span className="font-medium">{stats?.otherFundedCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${((stats?.otherFundedCount || 0) / (stats?.totalSwimmers || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/swimmers" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Swimmer
              </Button>
            </Link>
            <Link href="/admin/sessions" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Generate Sessions
              </Button>
            </Link>
            <Link href="/coordinator/pos" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Manage POs
              </Button>
            </Link>
            <Link href="/admin/referrals" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.type === 'lesson_complete' ? 'bg-green-500' :
                      activity.type === 'referral' ? 'bg-blue-500' :
                      activity.type === 'po_approved' ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}