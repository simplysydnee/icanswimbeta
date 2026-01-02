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
import { useSwimmerMetrics } from '@/hooks/useSwimmerMetrics';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function AdminSwimmersPage() {
  const { data: metrics, isLoading, error } = useSwimmerMetrics();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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
                {isLoading ? <Skeleton className="h-8 w-16" /> : error ? 'Error' : metrics?.totalSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                All clients
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
                {isLoading ? <Skeleton className="h-8 w-16" /> : error ? 'Error' : metrics?.waitlistedSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isLoading || error ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.waitlistedSwimmers / metrics!.totalSwimmers) * 100)}% of total`}
              </div>
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
                {isLoading ? <Skeleton className="h-8 w-16" /> : error ? 'Error' : metrics?.activeEnrolledSwimmers.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isLoading || error ? <Skeleton className="h-4 w-20" /> : `${Math.round((metrics!.activeEnrolledSwimmers / metrics!.totalSwimmers) * 100)}% of total`}
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
                {isLoading ? <Skeleton className="h-8 w-16" /> : error ? 'Error' : metrics?.averageLessons.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                per swimmer
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Notice */}
        {isMobile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Mobile View:</span> Swimmers are displayed as cards for better touch experience. Tap any card to view details.
            </p>
          </div>
        )}

        {/* Main Table - Desktop, Cards - Mobile */}
        {isMobile ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Showing swimmers as cards for mobile. Use filters above to search.
            </p>
            {/* Note: In a real implementation, you would fetch swimmers here and map them to SwimmerCard components */}
            <div className="text-center py-8 text-muted-foreground">
              <p>Swimmer cards would appear here on mobile</p>
              <p className="text-sm mt-2">(Table view shown on desktop)</p>
            </div>
          </div>
        ) : (
          <SwimmerManagementTable role="admin" />
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
            <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Needs Assessment
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Regional Center Renewals Due
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                No Upcoming Sessions
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Waitlist Priority
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