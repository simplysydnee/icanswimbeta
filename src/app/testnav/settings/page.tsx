'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Shield, Bell, Palette, ChevronRight } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'Settings Overview',
  sidebar: {
    enabled: true,
    section: 'Settings',
    icon: 'Settings',
  },
  breadcrumb: {
    path: ['TestNav', 'Settings'],
  },
};

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            This is the Y level - Settings section (different branch from Analytics).
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your personal information, avatar, and account preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/testnav/settings/profile" className="flex items-center justify-between">
                  <span>Edit Profile</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>
                Password, two-factor authentication, and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Security Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Email, push notifications, and communication preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Notification Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Theme, display preferences, and interface customization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Commonly used settings and configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Toggle dark theme</div>
                </div>
                <Button variant="outline" size="sm">
                  Toggle
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive email updates</div>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Auth</div>
                  <div className="text-sm text-muted-foreground">Extra security layer</div>
                </div>
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Hierarchy</CardTitle>
              <CardDescription>
                Current position in the Settings branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>X:</strong> TestNav (Header)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span><strong>Y:</strong> Settings (Sidebar Primary) ← Current Level</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                This demonstrates a different Y-level branch from Analytics. The sidebar should show &quot;Settings&quot; as a separate main section.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Sub-sections</CardTitle>
            <CardDescription>
              Explore the Z level navigation items available in this Settings section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Profile</div>
                    <div className="text-sm text-muted-foreground">Personal information and preferences</div>
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/testnav/settings/profile">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Security</div>
                    <div className="text-sm text-muted-foreground">Password and authentication settings</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}