'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, TrendingUp, ChevronRight } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'Analytics Overview',
  sidebar: {
    enabled: true,
    section: 'Analytics',
    icon: 'BarChart3',
  },
  breadcrumb: {
    path: ['TestNav', 'Analytics'],
  },
};

export default function AnalyticsPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            This is the Y level - Analytics section of the navigation hierarchy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
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
                <span className="text-green-600">+5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-2%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Reports Section</span>
              </CardTitle>
              <CardDescription>
                Access detailed analytics reports and data visualizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/testnav/analytics/reports" className="flex items-center justify-between">
                  <span>View Reports</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Real-time Data</span>
              </CardTitle>
              <CardDescription>
                Monitor live analytics and user activity as it happens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Live Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Sub-sections</CardTitle>
            <CardDescription>
              Explore the Z level navigation items available in this Analytics section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Reports</div>
                    <div className="text-sm text-muted-foreground">Generate and view various analytics reports</div>
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/testnav/analytics/reports">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              This demonstrates the Y level of navigation. The sidebar should show &quot;Analytics&quot; as an expanded section.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}