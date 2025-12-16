'use client'

import { useAuth } from '@/contexts/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PendingEnrollmentAlert } from '@/components/dashboard/PendingEnrollmentAlert'
import { PendingReferralsAlert } from '@/components/dashboard/PendingReferralsAlert'
import Link from 'next/link'
import { FileText, Building2, Users } from 'lucide-react'

export default function DashboardPage() {
  const { user, role, isLoadingProfile } = useAuth()

  // Show loading state while profile is being fetched
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.fullName || user?.email}!
          {role && ` (${role.charAt(0).toUpperCase() + role.slice(1)})`}
        </p>
      </div>

      {/* Pending enrollment alert for parents */}
      {role === 'parent' && (
        <PendingEnrollmentAlert />
      )}

      {/* Pending referrals alert for admins */}
      {role === 'admin' && (
        <PendingReferralsAlert />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Parent Dashboard */}
        <RoleGuard allowedRoles={['parent']} noRedirect={true}>
          <Card>
            <CardHeader>
              <CardTitle>Parent Dashboard</CardTitle>
              <CardDescription>
                Manage your swimmers and bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/parent/book">
                  Book Now
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/parent/swimmers">
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
        <RoleGuard allowedRoles={['instructor']} noRedirect={true}>
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
                <Link href="/instructor/swimmers">
                  My Swimmers
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
              <Button variant="outline" asChild className="w-full">
                <Link href="/instructor/settings">
                  Profile Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </RoleGuard>

        {/* Admin Dashboard */}
        <RoleGuard allowedRoles={['admin']} noRedirect={true}>
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
                <Link href="/admin/sessions">
                  Session Generator
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/referrals" className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  VMRC Referrals
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/bookings" className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Bookings
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/funding-sources" className="flex items-center justify-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Funding Sources
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/instructors" className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  Instructors
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/swimmers" className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  All Swimmers
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
        <RoleGuard allowedRoles={['vmrc_coordinator']} noRedirect={true}>
          <Card>
            <CardHeader>
              <CardTitle>VMRC Coordinator Dashboard</CardTitle>
              <CardDescription>
                Submit referrals and manage VMRC purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d] text-white">
                <Link href="/referral">
                  New Referral
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
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