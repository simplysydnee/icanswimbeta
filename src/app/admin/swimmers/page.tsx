'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SwimmerManagementTable } from '@/components/swimmers/SwimmerManagementTable';
import { SwimmerCard } from '@/components/swimmers/SwimmerCard';
import { SwimmerAnalyticsModal } from '@/components/admin/SwimmerAnalyticsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Download, Filter, BarChart3, Clock, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSwimmers } from '@/hooks/useAdminSwimmers';
import { calculateSwimmerKPIs } from '@/lib/admin-utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Swimmer } from '@/types/swimmer';

export default function AdminSwimmersPage() {
  const { data: swimmers, isLoading: swimmersLoading, error: swimmersError, refetch } = useAdminSwimmers();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Calculate metrics from swimmers data
  const metrics = swimmers ? calculateSwimmerKPIs(swimmers) : null;
  const metricsLoading = swimmersLoading;
  const metricsError = swimmersError;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Swimmers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.total.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics && !metricsLoading && !metricsError ? `${metrics.vmrcClients} Funded, ${metrics.privatePayClients} Private` : 'All clients'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.waitlist.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metricsLoading || metricsError ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.waitlist / metrics!.total) * 100)}% of total`}
              </div>
              {!metricsLoading && !metricsError && metrics && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Waitlist:</span>
                      <span className="font-medium">{metrics.waitlist}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Enrollment:</span>
                      <span className="font-medium">{metrics.pendingEnrollment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Approval:</span>
                      <span className="font-medium">{metrics.pendingApprovalEnrollment}</span>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Active Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? <Skeleton className="h-8 w-16" /> : metricsError ? 'Error' : metrics?.enrolled.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metricsLoading || metricsError ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.enrolled / metrics!.total) * 100)}% of total`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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
                <div className="text-sm text-muted-foreground mb-4">{swimmersError}</div>
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
                      first_name: swimmer.first_name,
                      last_name: swimmer.last_name,
                      photo_url: swimmer.photo_url,
                      enrollment_status: swimmer.enrollment_status,
                      current_level: swimmer.current_level?.display_name || swimmer.current_level?.name,
                      payment_type: swimmer.is_vmrc_client ? 'funding_source' : 'private_pay'
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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