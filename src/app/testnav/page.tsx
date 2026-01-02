'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Settings, ChevronRight } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'Test Navigation',
  sidebar: {
    enabled: true,
    section: 'TestNav',
    icon: 'Home',
  },
  breadcrumb: {
    path: ['TestNav'],
  },
};

export default function TestNavPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Test Navigation System</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the navigation test area. This demonstrates the X level of the navigation hierarchy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics Section</span>
              </CardTitle>
              <CardDescription>
                Explore the analytics dashboard with reports and data visualization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/testnav/analytics" className="flex items-center justify-between">
                  <span>Go to Analytics</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Settings Section</span>
              </CardTitle>
              <CardDescription>
                Manage your preferences and account settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/testnav/settings" className="flex items-center justify-between">
                  <span>Go to Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Hierarchy</CardTitle>
            <CardDescription>
              This page demonstrates the complete navigation structure:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div>
                <strong>X Level (Header):</strong> TestNav - Main navigation in header
              </div>
              <div>
                <strong>Y Level (Sidebar Primary):</strong> Analytics, Settings - Main sidebar sections
              </div>
              <div>
                <strong>Z Level (Sidebar Secondary):</strong> Reports, Users, Profile - Nested under Y items
              </div>
              <div>
                <strong>W Level (Breadcrumb Only):</strong> Specific pages shown in breadcrumbs
              </div>
            </div>
            <p className="text-muted-foreground">
              Navigate through the sections using the sidebar (click Menu to toggle) or the links above to see the complete hierarchy in action.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}