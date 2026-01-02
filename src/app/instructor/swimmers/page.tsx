'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { SwimmerManagementTable } from '@/components/swimmers/SwimmerManagementTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Award, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstructorSwimmersPage() {
  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Swimmers</h1>
            <p className="text-muted-foreground">
              View and manage swimmers assigned to you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule View
            </Button>
            <Button variant="outline" size="sm">
              <Award className="h-4 w-4 mr-2" />
              Progress Reports
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Swimmers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <div className="text-xs text-muted-foreground mt-1">
                Active assignments
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <div className="text-xs text-muted-foreground mt-1">
                Sessions scheduled
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assessments Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-muted-foreground mt-1">
                Need progress updates
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72%</div>
              <div className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
                +5% this month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <SwimmerManagementTable role="instructor" />

        {/* Quick Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quick Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Today&apos;s Swimmers
              </Button>
              <Button variant="outline" className="justify-start">
                <Award className="h-4 w-4 mr-2" />
                Ready for Next Level
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Regional Center Clients
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                New Swimmers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  • This view shows only swimmers you have taught or are scheduled to teach.
                </p>
                <p>
                  • Use the search and filters to quickly find specific swimmers.
                </p>
                <p>
                  • Click &quot;View&quot; to see detailed swimmer information and progress notes.
                </p>
                <p>
                  • Regional center clients show session usage (used/authorized) next to lesson count.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}