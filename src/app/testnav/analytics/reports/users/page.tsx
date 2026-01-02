'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Calendar, Download, Filter } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'User Reports',
  sidebar: {
    enabled: true,
    section: 'Analytics',
    subsection: 'Reports',
    icon: 'Users',
  },
  breadcrumb: {
    path: ['TestNav', 'Analytics', 'Reports', 'Users'],
  },
};

export default function UserReportsPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Reports</h1>
            <p className="text-muted-foreground mt-2">
              This is the W level - Detailed user analytics page (shown only in breadcrumbs).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18%</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-2%</span> this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-1 md:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Activity Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of user engagement patterns and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Daily Active Users</div>
                      <div className="text-sm text-muted-foreground">Users who logged in today</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">457</div>
                    <div className="text-sm text-green-600">+8%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Weekly Active Users</div>
                      <div className="text-sm text-muted-foreground">Users active in the last 7 days</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">1,234</div>
                    <div className="text-sm text-green-600">+5%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Monthly Active Users</div>
                      <div className="text-sm text-muted-foreground">Users active in the last 30 days</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">2,847</div>
                    <div className="text-sm text-green-600">+18%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Level</CardTitle>
              <CardDescription>
                Complete hierarchy demonstration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>X:</strong> TestNav</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>Y:</strong> Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span><strong>Z:</strong> Reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span><strong>W:</strong> Users ← Current Page</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                  <strong>W Level:</strong> This page demonstrates the deepest navigation level. 
                  It appears only in breadcrumbs, not in the sidebar navigation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement Timeline</CardTitle>
            <CardDescription>
              Recent user activities and key engagement metrics over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Peak usage detected</div>
                  <div className="text-sm text-muted-foreground">Today at 2:30 PM - 347 concurrent users</div>
                </div>
                <div className="text-sm text-green-600 font-medium">+23% above average</div>
              </div>

              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">New user cohort analysis</div>
                  <div className="text-sm text-muted-foreground">Weekly signup trend shows consistent growth</div>
                </div>
                <div className="text-sm text-blue-600 font-medium">View Details</div>
              </div>

              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Retention improvement</div>
                  <div className="text-sm text-muted-foreground">7-day retention up 8% from last month</div>
                </div>
                <div className="text-sm text-green-600 font-medium">+8%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}