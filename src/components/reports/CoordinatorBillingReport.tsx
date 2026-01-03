'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { exportToCSV } from '@/lib/export-csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Mail, Phone, User, Clock, AlertCircle, DollarSign, TrendingDown, CheckCircle } from 'lucide-react';

interface CoordinatorBillingData {
  coordinator_name: string;
  coordinator_email: string;
  swimmer_count: number;
  total_pos: number;
  approved_pos: number;
  pending_pos: number;
  overdue_pos: number;
  avg_days_to_approve: number;
  overdue_balance_cents: number;
  approval_rate_percent: number;
}

interface SwimmerWithPOSIssue {
  swimmer_name: string;
  coordinator_name: string;
  coordinator_email: string;
  sessions_used: number;
  sessions_authorized: number;
  pos_status: string;
  pos_requested: string;
  days_pending: number;
  overdue_balance_cents: number;
}

interface CoordinatorBillingReportData {
  coordinators: CoordinatorBillingData[];
  swimmersWithIssues: SwimmerWithPOSIssue[];
  summary: {
    total_coordinators: number;
    total_overdue_pos: number;
    total_overdue_balance: number;
    avg_response_days: number;
    total_pending_pos: number;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export function CoordinatorBillingReport() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [data, setData] = useState<CoordinatorBillingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      });

      const response = await fetch(`/api/reports/coordinator-billing?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching coordinator billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!data?.coordinators) return;

    const csvData = data.coordinators.map(coordinator => ({
      'Coordinator Name': coordinator.coordinator_name,
      'Email': coordinator.coordinator_email,
      'Swimmer Count': coordinator.swimmer_count,
      'Total POs': coordinator.total_pos,
      'Approved POs': coordinator.approved_pos,
      'Pending POs': coordinator.pending_pos,
      'Overdue POs': coordinator.overdue_pos,
      'Avg Days to Approve': coordinator.avg_days_to_approve?.toFixed(1) || 'N/A',
      'Overdue Balance': `$${(coordinator.overdue_balance_cents / 100).toFixed(2)}`,
      'Approval Rate %': coordinator.approval_rate_percent?.toFixed(1) || '0'
    }));

    exportToCSV(csvData, `coordinator-billing-${new Date().toISOString().split('T')[0]}`);
  };

  const getResponseTimeColor = (days: number) => {
    if (days <= 7) return 'bg-green-100 text-green-800 border-green-300';
    if (days <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getApprovalRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getOverdueStatus = (overduePos: number, overdueBalance: number) => {
    if (overduePos === 0 && overdueBalance === 0) return 'bg-green-100 text-green-800 border-green-300';
    if (overduePos > 0 || overdueBalance > 0) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading coordinator billing data: {error}</p>
            <Button onClick={fetchData} className="mt-4">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Coordinator Billing & Authorization</h2>
          <p className="text-muted-foreground">
            Track POS authorization times, overdue balances, and coordinator performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avg_response_days?.toFixed(1) || '0'} days
            </div>
            <div className="text-sm text-muted-foreground">
              Lower is better
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Overdue POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.summary.total_overdue_pos || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              &gt; 14 days pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Overdue Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data?.summary.total_overdue_balance || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total outstanding
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Pending POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data?.summary.total_pending_pos || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Awaiting authorization
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Chart */}
      {data?.statusBreakdown && data.statusBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>POS Status Breakdown</CardTitle>
            <CardDescription>Distribution of purchase order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Status Details</h3>
                {data.statusBreakdown.map((status, index) => (
                  <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="font-medium">{status.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{status.count}</div>
                      <div className="text-sm text-muted-foreground">{status.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coordinator Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Coordinator Performance Details</span>
            <div className="text-sm font-normal text-muted-foreground">
              {data?.coordinators.length || 0} coordinators
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Swimmers</TableHead>
                  <TableHead>Total POs</TableHead>
                  <TableHead>Avg Response Time</TableHead>
                  <TableHead>Pending POs</TableHead>
                  <TableHead>Overdue POs</TableHead>
                  <TableHead>Overdue Balance</TableHead>
                  <TableHead>Approval Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.coordinators.map((coordinator) => (
                  <TableRow key={coordinator.coordinator_email} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div>{coordinator.coordinator_name}</div>
                          {coordinator.coordinator_email && (
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {coordinator.coordinator_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{coordinator.swimmer_count}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{coordinator.total_pos}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getResponseTimeColor(coordinator.avg_days_to_approve || 0)}>
                        {coordinator.avg_days_to_approve?.toFixed(1) || 'N/A'} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-yellow-600">
                        {coordinator.pending_pos}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-red-600">
                        {coordinator.overdue_pos}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-red-600">
                        {formatCurrency(coordinator.overdue_balance_cents)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getApprovalRateColor(coordinator.approval_rate_percent || 0)}>
                        {coordinator.approval_rate_percent?.toFixed(1) || '0'}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getOverdueStatus(coordinator.overdue_pos, coordinator.overdue_balance_cents)}>
                        {coordinator.overdue_pos > 0 || coordinator.overdue_balance_cents > 0 ? '⚠️ Needs Attention' : '✅ Good'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {(!data?.coordinators || data.coordinators.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No coordinator data available for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Swimmers with POS Issues */}
      {data?.swimmersWithIssues && data.swimmersWithIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Swimmers with POS Issues
              </span>
              <Badge variant="destructive">
                {data.swimmersWithIssues.length} issues
              </Badge>
            </CardTitle>
            <CardDescription>
              Swimmers with pending authorization, sessions used exceeding authorized, or overdue balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Sessions Used</TableHead>
                    <TableHead>Sessions Authorized</TableHead>
                    <TableHead>POS Status</TableHead>
                    <TableHead>Days Pending</TableHead>
                    <TableHead>Overdue Balance</TableHead>
                    <TableHead>Action Needed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.swimmersWithIssues.map((swimmer, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{swimmer.swimmer_name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{swimmer.coordinator_name}</div>
                          <div className="text-sm text-muted-foreground">{swimmer.coordinator_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{swimmer.sessions_used}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{swimmer.sessions_authorized}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={swimmer.pos_status === 'pending' ? 'outline' : 'secondary'}>
                          {swimmer.pos_status || 'No POS'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${swimmer.days_pending > 14 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {swimmer.days_pending?.toFixed(0) || 'N/A'} days
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-red-600">
                          {formatCurrency(swimmer.overdue_balance_cents)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {swimmer.pos_status === 'pending' && swimmer.days_pending > 14 && (
                            <Badge variant="destructive" className="text-xs">
                              Escalate to supervisor
                            </Badge>
                          )}
                          {swimmer.sessions_used >= swimmer.sessions_authorized - 2 && (
                            <Badge variant="outline" className="text-xs">
                              Authorization needed
                            </Badge>
                          )}
                          {swimmer.overdue_balance_cents > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Payment overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Priority items requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.summary.total_overdue_pos > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Overdue POS Requiring Escalation</h4>
                  <p className="text-sm text-red-700">
                    There are {data.summary.total_overdue_pos} purchase orders pending for more than 14 days.
                    Consider escalating to supervisors for the following coordinators:
                  </p>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {data.coordinators
                      .filter(c => c.overdue_pos > 0)
                      .map(c => (
                        <li key={c.coordinator_email}>
                          {c.coordinator_name} ({c.coordinator_email}): {c.overdue_pos} overdue POs
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {data?.summary.total_overdue_balance > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <h4 className="font-medium text-orange-800">Overdue Balances</h4>
                  <p className="text-sm text-orange-700">
                    Total overdue balance: {formatCurrency(data.summary.total_overdue_balance)}.
                    Consider sending payment reminders or escalating to billing department.
                  </p>
                </div>
              </div>
            </div>
          )}

          {data?.coordinators.filter(c => c.avg_days_to_approve > 14).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">Slow Response Coordinators</h4>
                  <p className="text-sm text-yellow-700">
                    {data.coordinators.filter(c => c.avg_days_to_approve > 14).length} coordinator(s)
                    have average response times over 14 days. Consider implementing reminder systems
                    or establishing service level agreements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {data?.coordinators.filter(c => c.approval_rate_percent < 50).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-800">Low Approval Rates</h4>
                  <p className="text-sm text-blue-700">
                    {data.coordinators.filter(c => c.approval_rate_percent < 50).length} coordinator(s)
                    have approval rates below 50%. Consider reviewing submission quality or
                    coordinator training needs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}