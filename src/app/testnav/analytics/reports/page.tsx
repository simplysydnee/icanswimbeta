'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Download, Calendar, ChevronRight } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'Analytics Reports',
  sidebar: {
    enabled: true,
    section: 'Analytics',
    subsection: 'Reports',
    icon: 'FileText',
  },
  breadcrumb: {
    path: ['TestNav', 'Analytics', 'Reports'],
  },
};

export default function ReportsPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Reports</h1>
            <p className="text-muted-foreground mt-2">
              This is the Z level - Reports subsection under Analytics.
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Reports</span>
              </CardTitle>
              <CardDescription>
                Detailed analytics and insights about user behavior and engagement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/testnav/analytics/reports/users" className="flex items-center justify-between">
                  <span>View User Reports</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Monthly Reports</span>
              </CardTitle>
              <CardDescription>
                Comprehensive monthly performance and growth analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Monthly
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Custom Reports</span>
              </CardTitle>
              <CardDescription>
                Create and download custom analytics reports for specific needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Create Custom
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Your most recently generated and accessed reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">User Activity Report</div>
                    <div className="text-sm text-muted-foreground">Generated 2 hours ago</div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Monthly Performance</div>
                    <div className="text-sm text-muted-foreground">Generated 1 day ago</div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Conversion Analysis</div>
                    <div className="text-sm text-muted-foreground">Generated 3 days ago</div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Hierarchy</CardTitle>
              <CardDescription>
                Current level in the navigation structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>X:</strong> TestNav (Header)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>Y:</strong> Analytics (Sidebar Primary)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span><strong>Z:</strong> Reports (Sidebar Secondary) ← Current Level</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                This page shows the Z level navigation. The sidebar should display &quot;Analytics&quot; as expanded with &quot;Reports&quot; highlighted as a sub-item.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}