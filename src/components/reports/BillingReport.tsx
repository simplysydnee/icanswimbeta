'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthSelector } from './MonthSelector';
import { CoordinatorPerformance } from './CoordinatorPerformance';
import { OutstandingPOsList } from './OutstandingPOsList';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface BillingReportData {
  month: number;
  year: number;
  dateRange: {
    start: string;
    end: string;
  };
  stats: {
    poStatus: {
      pending: number;
      in_progress: number;
      approved: number;
      completed: number;
      expired: number;
    };
    billingStatus: {
      unbilled: number;
      billed: number;
      paid: number;
      partial: number;
      overdue: number;
      disputed: number;
    };
    financial: {
      totalBilled: number;
      totalPaid: number;
      totalOutstanding: number;
      totalOverdue: number;
    };
    byFundingSource: Record<string, {
      name: string;
      shortName: string;
      poCount: number;
      billed: number;
      paid: number;
      outstanding: number;
    }>;
    byCoordinator: Record<string, {
      name: string;
      email: string;
      phone: string;
      totalPOs: number;
      completedAuth: number;
      pendingAuth: number;
      completionRate: number;
    }>;
    problemPOs: Array<{
      id: string;
      swimmerName: string;
      coordinatorName: string;
      coordinatorEmail: string;
      coordinatorPhone: string;
      amountOwed: number;
      daysOverdue: number;
      fundingSourceName: string;
      status: string;
      billingStatus: string;
      dueDate: string | null;
    }>;
  };
  totalPOs: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: AlertCircle },
};

const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  unbilled: { label: 'Unbilled', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  billed: { label: 'Billed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
};

export function BillingReport() {
  const [data, setData] = useState<BillingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchBillingData = async (month: number, year: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/billing?month=${month}&year=${year}`);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Failed to fetch billing data: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Check if the API returned an error in the response body
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      // Clear data on error to prevent showing stale data
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Report</h3>
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchBillingData(currentMonth, currentYear)}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Ensure stats object exists with defaults
  const stats = data.stats || {
    poStatus: {},
    billingStatus: {},
    financial: { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, totalOverdue: 0 },
    byFundingSource: {},
    byCoordinator: {},
    problemPOs: []
  };

  const totalPOs = data.totalPOs || 0;

  return (
    <div className="space-y-6">
      <MonthSelector
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={handleMonthChange}
      />

      {/* Summary Cards - PO Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(stats.poStatus).map(([status, count]) => {
          const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText };
          const Icon = config.icon;

          return (
            <Card key={`po-${status}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{config.label}</span>
                  <Icon className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {totalPOs > 0 ? `${Math.round((count / totalPOs) * 100)}% of POs` : 'No POs'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Cards - Billing Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {Object.entries(stats.billingStatus).map(([status, count]) => {
          const config = BILLING_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText };
          const Icon = config.icon;

          return (
            <Card key={`billing-${status}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{config.label}</span>
                  <Icon className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {totalPOs > 0 ? `${Math.round((count / totalPOs) * 100)}% of POs` : 'No POs'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Billed</span>
              <DollarSign className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.financial?.totalBilled?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount invoiced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Amount Received</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(stats.financial?.totalPaid || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats.financial?.totalBilled || 0) > 0
                ? `${Math.round(((stats.financial?.totalPaid || 0) / (stats.financial?.totalBilled || 1)) * 100)}% collection rate`
                : 'No billing'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Outstanding</span>
              <TrendingDown className="h-4 w-4 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.financial?.totalOutstanding?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats.financial?.totalOverdue || 0) > 0 && (
                <span className="text-red-600">
                  ${(stats.financial?.totalOverdue || 0).toFixed(2)} overdue
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total POs</span>
              <FileText className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPOs}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(data.dateRange.start), 'MMM d')} - {format(new Date(data.dateRange.end), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="funding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funding" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            By Funding Source
          </TabsTrigger>
          <TabsTrigger value="coordinators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            By Coordinator
          </TabsTrigger>
          <TabsTrigger value="outstanding" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Outstanding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funding">
          <Card>
            <CardHeader>
              <CardTitle>Funding Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Funding Source</th>
                      <th className="text-left py-3 px-4">PO Count</th>
                      <th className="text-left py-3 px-4">Billed</th>
                      <th className="text-left py-3 px-4">Paid</th>
                      <th className="text-left py-3 px-4">Outstanding</th>
                      <th className="text-left py-3 px-4">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.byFundingSource).map(([id, fs]) => (
                      <tr key={id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{fs.name}</div>
                          <div className="text-sm text-muted-foreground">{fs.shortName}</div>
                        </td>
                        <td className="py-3 px-4">{fs.poCount}</td>
                        <td className="py-3 px-4">${(fs.billed || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">${(fs.paid || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={(fs.outstanding || 0) > 0 ? 'text-yellow-600 font-medium' : ''}>
                            ${(fs.outstanding || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-green-600 h-2.5 rounded-full"
                                style={{ width: `${(fs.billed || 0) > 0 ? Math.min(100, ((fs.paid || 0) / (fs.billed || 0)) * 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {(fs.billed || 0) > 0 ? Math.round(((fs.paid || 0) / (fs.billed || 0)) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {Object.keys(stats.byFundingSource).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No funding source data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators">
          <CoordinatorPerformance coordinators={stats.byCoordinator} />
        </TabsContent>

        <TabsContent value="outstanding">
          <OutstandingPOsList problemPOs={stats.problemPOs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}