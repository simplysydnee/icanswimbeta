'use client';

import { useState, Suspense } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SwimmerManagementTable } from '@/components/swimmers/SwimmerManagementTable';
import { SwimmerCard } from '@/components/swimmers/SwimmerCard';
import { SwimmerAnalyticsModal } from '@/components/admin/SwimmerAnalyticsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Download, Filter, BarChart3, Clock, UserCheck, UserX, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSwimmers } from '@/hooks/useAdminSwimmers';
import { useSwimmerMetrics } from '@/hooks/useSwimmerMetrics';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Swimmer } from '@/types/swimmer';

function AdminSwimmersPageContent() {
  const { data: swimmers, isLoading: swimmersLoading, error: swimmersError, refetch } = useAdminSwimmers();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('approval_status');

  // Calculate metrics from dedicated stats endpoint (server-side counts)
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useSwimmerMetrics();

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Swimmer Management</h1>
            <p className="text-muted-foreground">
              View and manage all swimmers in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnalyticsOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Total Swimmers
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.totalSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics && !metricsLoading && !metricsError ? `${metrics.vmrcClients} Funded, ${metrics.privatePayClients} Private` : 'All clients'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.waitlistedSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metricsLoading || metricsError ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.waitlistedSwimmers / metrics!.totalSwimmers) * 100)}% of total`}
              </div>
              {!metricsLoading && !metricsError && metrics && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Waitlist:</span>
                      <span className="font-medium">{metrics.waitlistBreakdown.waitlist}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Enrollment:</span>
                      <span className="font-medium">{metrics.waitlistBreakdown.pending_enrollment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Approval:</span>
                      <span className="font-medium">{metrics.waitlistBreakdown.pending_approval}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrollment Expired:</span>
                      <span className="font-medium">{metrics.enrollmentExpired}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Active Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.activeEnrolledSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metricsLoading || metricsError ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.activeEnrolledSwimmers / metrics!.totalSwimmers) * 100)}% of total`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Avg. Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.activeSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics && !metricsLoading && !metricsError ? `active in last 30 days` : 'Active swimmers'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Notice - Removed to prevent horizontal scroll */}
        {/* {isMobile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Mobile View:</span> Swimmers are displayed as cards for better touch experience. Tap any card to view details.
            </p>
          </div>
        )} */}

        {/* Pending Approval Alert */}
        {!swimmersLoading && !swimmersError && metrics && metrics.pendingApproval > 0 && (
          <Card
            className={`cursor-pointer transition-all ${activeFilter === 'pending' ? 'ring-2 ring-orange-400 border-orange-400' : 'border-orange-200 hover:shadow-md'}`}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (activeFilter === 'pending') {
                params.delete('approval_status');
              } else {
                params.set('approval_status', 'pending');
              }
              router.push(`/admin/swimmers?${params.toString()}`);
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">
                      {metrics.pendingApproval} Swimmer{metrics.pendingApproval !== 1 ? 's' : ''} Pending Approval
                    </p>
                    <p className="text-sm text-orange-700">
                      {activeFilter === 'pending' ? 'Click to clear filter' : 'Click to review and take action'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-sm px-3 py-1">
                  {activeFilter === 'pending' ? 'Filtered' : 'Action Needed'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Table - Desktop, Cards - Mobile */}
        {isMobile ? (
          <div className="space-y-4">
            {/* Removed instructional text to reduce clutter */}

            {swimmersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : swimmersError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                <div className="text-destructive font-medium mb-2">Error loading swimmers</div>
                <div className="text-sm text-muted-foreground mb-4">{swimmersError instanceof Error ? swimmersError.message : String(swimmersError)}</div>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : !swimmers || swimmers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No swimmers found</p>
                <p className="text-sm mt-2">Add swimmers to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {swimmers.map((swimmer: any) => (
                  <SwimmerCard
                    key={swimmer.id}
                    swimmer={{
                      id: swimmer.id,
                      first_name: swimmer.firstName,
                      last_name: swimmer.lastName,
                      photo_url: swimmer.photoUrl,
                      enrollment_status: swimmer.enrollmentStatus,
                      current_level: swimmer.currentLevel
                        ? { name: swimmer.currentLevel.displayName || swimmer.currentLevel.name }
                        : undefined,
                      payment_type: swimmer.isVmrcClient ? 'funding_source' : 'private_pay'
                    }}
                    onClick={() => {
                      // Navigate to swimmer detail page
                      window.location.href = `/admin/swimmers/${swimmer.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <SwimmerManagementTable role="admin" swimmers={swimmers} isLoading={swimmersLoading} error={swimmersError} />
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" className="justify-start text-left truncate">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Needs Assessment</span>
              </Button>
              <Button variant="outline" className="justify-start text-left truncate">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Regional Center Renewals Due</span>
              </Button>
              <Button variant="outline" className="justify-start text-left truncate">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">No Upcoming Sessions</span>
              </Button>
              <Button variant="outline" className="justify-start text-left truncate">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Waitlist Priority</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Modal */}
        <SwimmerAnalyticsModal
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
        />
      </div>
    </RoleGuard>
  );
}

export default function AdminSwimmersPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full mt-4" /></div>}>
      <AdminSwimmersPageContent />
    </Suspense>
  );
}
