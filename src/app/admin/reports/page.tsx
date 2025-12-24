'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsReport } from '@/components/reports/BookingsReport';
import { CancellationsReport } from '@/components/reports/CancellationsReport';
import { BillingReport } from '@/components/reports/BillingReport';
import { BarChart3, XCircle, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View booking, cancellation, and billing analytics</p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
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
        </TabsList>

        <TabsContent value="bookings">
          <BookingsReport />
        </TabsContent>

        <TabsContent value="cancellations">
          <CancellationsReport />
        </TabsContent>

        <TabsContent value="billing">
          <BillingReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}