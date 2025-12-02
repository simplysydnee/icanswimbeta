'use client'

import { useAuth } from '@/contexts/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, role } = useAuth()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.fullName || user?.email}!
          {role && ` (${role.charAt(0).toUpperCase() + role.slice(1)})`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Parent Dashboard */}
        <RoleGuard allowedRoles={['parent']}>
          <Card>
            <CardHeader>
              <CardTitle>Parent Dashboard</CardTitle>
              <CardDescription>
                Manage your swimmers and bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/booking">
                  Book Assessment
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/swimmers">
                  View Swimmers
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/schedule">
                  View Schedule
                </Link>
              </Button>
            </CardContent>
          </Card>
        </RoleGuard>

        {/* Instructor Dashboard */}
        <RoleGuard allowedRoles={['instructor']}>
          <Card>
            <CardHeader>
              <CardTitle>Instructor Dashboard</CardTitle>
              <CardDescription>
                Manage your lessons and students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/instructor/schedule">
                  My Schedule
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/instructor/students">
                  My Students
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/instructor/assessments">
                  Assessments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </RoleGuard>

        {/* Admin Dashboard */}
        <RoleGuard allowedRoles={['admin']}>
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Manage the entire system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/admin/users">
                  User Management
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/schedule">
                  Schedule Management
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/reports">
                  Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </RoleGuard>

        {/* VMRC Coordinator Dashboard */}
        <RoleGuard allowedRoles={['vmrc_coordinator']}>
          <Card>
            <CardHeader>
              <CardTitle>VMRC Coordinator Dashboard</CardTitle>
              <CardDescription>
                Manage VMRC purchase orders and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/vmrc/pos">
                  Purchase Orders
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/vmrc/billing">
                  Billing
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/vmrc/reports">
                  VMRC Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </RoleGuard>

        {/* Common Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/profile">
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/settings">
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}