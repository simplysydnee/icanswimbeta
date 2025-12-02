'use client';

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { NavigationConfig } from '@/types/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User } from 'lucide-react';

const navigationConfig: NavigationConfig = {
  title: 'Profile Settings',
  sidebar: {
    enabled: true,
    section: 'Settings',
    subsection: 'Profile',
    icon: 'User',
  },
  breadcrumb: {
    path: ['TestNav', 'Settings', 'Profile'],
  },
};

export default function ProfileSettingsPage() {
  const pathname = usePathname();

  return (
    <MainLayout config={navigationConfig} pathname={pathname}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              This is the Z level - Profile subsection under Settings.
            </p>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" defaultValue="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about yourself..." 
                    className="min-h-20"
                    defaultValue="Software developer passionate about building great user experiences."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Customize your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="UTC-5 (Eastern Time)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input id="language" defaultValue="English (US)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input id="dateFormat" defaultValue="MM/DD/YYYY" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile avatar image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/api/placeholder/100/100" alt="Profile" />
                      <AvatarFallback className="text-lg">JD</AvatarFallback>
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="absolute -bottom-2 -right-2 h-8 w-8"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Picture
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation Level</CardTitle>
                <CardDescription>
                  Current position in the Settings hierarchy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>X:</strong> TestNav</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span><strong>Y:</strong> Settings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>Z:</strong> Profile ← Current Level</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground text-sm">
                    This page shows the Z level in the Settings branch. The sidebar should display &quot;Settings&quot; as expanded with &quot;Profile&quot; highlighted.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Data
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}