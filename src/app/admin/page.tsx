'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ChevronRight,
  UserPlus,
  CalendarPlus,
  Mail,
  Settings,
  LayoutDashboard,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalSwimmers: number;
  activeSwimmers: number;
  waitlistedSwimmers: number;
  privatePayCount: number;
  fundedCount: number;
  sessionsToday: number;
  pendingReferrals: number;
  pendingPOs: number;
}

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'admin') {
      router.push('/dashboard');
    } else if (user) {
      fetchStats();
    }
  }, [role, user]);

  const fetchStats = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch swimmers data
      const { data: swimmers } = await supabase
        .from('swimmers')
        .select('id, enrollment_status, payment_type, is_vmrc_client');

      // Fetch pending purchase orders
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('id')
        .in('status', ['pending', 'approved_pending_auth']);

      // Fetch sessions for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .gte('start_time', today)
        .lt('start_time', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));

      const swimmerList = swimmers || [];

      // Calculate stats based on actual schema
      const activeSwimmers = swimmerList.filter(s => s.enrollment_status === 'enrolled').length;
      const waitlistedSwimmers = swimmerList.filter(s => s.enrollment_status === 'waitlist').length;
      const privatePayCount = swimmerList.filter(s => s.payment_type === 'private_pay').length;
      // Funded includes vmrc, scholarship, and other payment types
      const fundedCount = swimmerList.filter(s =>
        s.payment_type === 'vmrc' ||
        s.payment_type === 'scholarship' ||
        s.payment_type === 'other'
      ).length;

      setStats({
        totalSwimmers: swimmerList.length,
        activeSwimmers,
        waitlistedSwimmers,
        privatePayCount,
        fundedCount,
        sessionsToday: sessions?.length || 0,
        pendingReferrals: 0, // Placeholder - referral_requests table might not exist
        pendingPOs: pos?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = (stats?.pendingReferrals || 0) + (stats?.pendingPOs || 0);

  if (loading) {
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
                    {stats?.pendingReferrals} referrals • {stats?.pendingPOs} POs
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

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Action Required Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.pendingPOs ? (
              <Link href="/admin/pos" className="block">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">{stats.pendingPOs} Purchase Orders</p>
                      <p className="text-sm text-yellow-600">Need approval</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-yellow-400" />
                </div>
              </Link>
            ) : null}

            {!stats?.pendingPOs && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

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
                  <div className="font-medium">VMRC Referrals</div>
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