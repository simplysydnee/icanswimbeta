'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  PlusCircle,
  Clock,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  enrollment_status: string;
  funded_sessions_used?: number;
  funded_sessions_authorized?: number;
}

interface PurchaseOrder {
  id: string;
  status: string;
  po_type: string;
  allowed_lessons: number;
  swimmer: { first_name: string; last_name: string };
}

export default function CoordinatorDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    pendingPOs: 0,
    expiringPOs: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();

    if (!user) return;
    setUserName(profile?.full_name?.split(' ')[0] || 'Coordinator');

    // Get assigned clients
    const { data: clientsData } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, photo_url, enrollment_status, funded_sessions_used, funded_sessions_authorized')
      .eq('coordinator_id', user.id)
      .order('last_name');

    const clientsList = clientsData || [];
    setClients(clientsList);

    // Get pending POs
    const clientIds = clientsList.map(c => c.id);
    let posData: PurchaseOrder[] = [];

    if (clientIds.length > 0) {
      const { data } = await supabase
        .from('purchase_orders')
        .select('id, status, po_type, allowed_lessons, swimmer:swimmers(first_name, last_name)')
        .in('swimmer_id', clientIds)
        .eq('status', 'pending');
      posData = (data || []) as PurchaseOrder[];
    }
    setPendingPOs(posData);

    // Get expiring POs count
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let expiringCount = 0;
    if (clientIds.length > 0) {
      const { count } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact' })
        .in('swimmer_id', clientIds)
        .eq('status', 'approved')
        .lte('end_date', thirtyDaysFromNow.toISOString());
      expiringCount = count || 0;
    }

    const activeClients = clientsList.filter(c =>
      c.enrollment_status === 'enrolled' || c.enrollment_status === 'active'
    ).length;

    setStats({
      totalClients: clientsList.length,
      activeClients,
      pendingPOs: posData.length,
      expiringPOs: expiringCount,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
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
        <Link href="/coordinator/referrals/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Referral
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/coordinator/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">My Clients</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalClients}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stats.activeClients} active</p>
                </div>
                <div className="p-3 bg-cyan-100 rounded-full">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/coordinator/pos">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${stats.pendingPOs > 0 ? 'bg-orange-50 border-orange-200' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Pending POs</p>
                  <p className="text-3xl font-bold mt-1">{stats.pendingPOs}</p>
                  <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
                </div>
                <div className={`p-3 rounded-full ${stats.pendingPOs > 0 ? 'bg-orange-200' : 'bg-gray-100'}`}>
                  <FileText className={`h-6 w-6 ${stats.pendingPOs > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className={stats.expiringPOs > 0 ? 'bg-yellow-50 border-yellow-200' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-3xl font-bold mt-1">{stats.expiringPOs}</p>
                <p className="text-sm text-muted-foreground mt-1">Within 30 days</p>
              </div>
              <div className={`p-3 rounded-full ${stats.expiringPOs > 0 ? 'bg-yellow-200' : 'bg-gray-100'}`}>
                <Clock className={`h-6 w-6 ${stats.expiringPOs > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingPOs + stats.expiringPOs}</p>
                <p className="text-sm text-muted-foreground mt-1">Action items</p>
              </div>
              <div className={`p-3 rounded-full ${(stats.pendingPOs + stats.expiringPOs) > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`h-6 w-6 ${(stats.pendingPOs + stats.expiringPOs) > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending POs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Purchase Orders Needing Approval
            </CardTitle>
            <Link href="/coordinator/pos">
              <Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingPOs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">All POs approved!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPOs.slice(0, 4).map((po) => (
                  <Link key={po.id} href={`/coordinator/pos/${po.id}`}>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">{po.swimmer?.first_name} {po.swimmer?.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {po.po_type === 'assessment' ? 'Assessment' : 'Lessons'} • {po.allowed_lessons} sessions
                        </p>
                      </div>
                      <Badge className="bg-orange-200 text-orange-800">Pending</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              My Clients
            </CardTitle>
            <Link href="/coordinator/clients">
              <Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No clients assigned yet</p>
                <Link href="/coordinator/referrals/new">
                  <Button variant="outline" className="mt-2">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Submit a Referral
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <Link key={client.id} href={`/coordinator/clients/${client.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        {client.photo_url ? (
                          <Image src={client.photo_url} alt={client.first_name} width={40} height={40} className="rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-medium">
                            {client.first_name?.[0]}{client.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{client.first_name} {client.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.funded_sessions_used || 0}/{client.funded_sessions_authorized || 0} sessions
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        client.enrollment_status === 'enrolled' || client.enrollment_status === 'active'
                          ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }>
                        {client.enrollment_status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/coordinator/referrals/new">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <PlusCircle className="h-6 w-6" />
                <span>New Referral</span>
              </Button>
            </Link>
            <Link href="/coordinator/clients">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>View Clients</span>
              </Button>
            </Link>
            <Link href="/coordinator/pos">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Purchase Orders</span>
              </Button>
            </Link>
            <Link href="/coordinator/progress">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <ClipboardList className="h-6 w-6" />
                <span>Progress Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}