'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsReport } from '@/components/reports/BookingsReport';
import { CancellationsReport } from '@/components/reports/CancellationsReport';
import { ComprehensiveBillingReport } from '@/components/reports/ComprehensiveBillingReport';
import { TimecardReport } from '@/components/reports/TimecardReport';
import { InstructorPerformanceReport } from '@/components/reports/InstructorPerformanceReport';
import { CoordinatorBillingReport } from '@/components/reports/CoordinatorBillingReport';
import { TopProblemCoordinators } from '@/components/reports/TopProblemCoordinators';
import { BarChart3, XCircle, DollarSign, Clock, Users, AlertCircle, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View booking, cancellation, billing, and performance analytics</p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="cancellations" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancellations
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing & Revenue
          </TabsTrigger>
          <TabsTrigger value="timecards" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timecards
          </TabsTrigger>
          <TabsTrigger value="instructor-performance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Instructor Performance
          </TabsTrigger>
          <TabsTrigger value="coordinator-billing" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Coordinator Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingsReport />
        </TabsContent>

        <TabsContent value="cancellations">
          <CancellationsReport />
        </TabsContent>

        <TabsContent value="billing">
          <ComprehensiveBillingReport />
        </TabsContent>

        <TabsContent value="timecards">
          <TimecardReport />
        </TabsContent>

        <TabsContent value="instructor-performance">
          <InstructorPerformanceReport />
        </TabsContent>

        <TabsContent value="coordinator-billing">
          <CoordinatorBillingReport />
        </TabsContent>
      </Tabs>

      {/* Top Problem Coordinators Card (always visible) */}
      <div className="mt-8">
        <TopProblemCoordinators />
      </div>
    </div>
  );
}