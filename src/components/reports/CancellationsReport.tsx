'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { exportToCSV } from '@/lib/export-csv';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { AlertTriangle, Download, TrendingUp, Clock, Users, Percent } from 'lucide-react';

interface CancellationData {
  id: string;
  status: string;
  created_at: string;
  canceled_at: string | null;
  cancel_reason: string | null;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  session: {
    id: string;
    start_time: string;
  } | null;
}

interface CancellationsReportData {
  total: number;
  totalBookings: number;
  cancellationRate: string;
  lateCancellations: number;
  regularCancellations: number;
  bySwimmer: Array<{ name: string; count: number }>;
  byReason: Record<string, number>;
  byDate: Array<{ date: string; count: number }>;
  cancellations: CancellationData[];
}

const reasonColors: Record<string, string> = {
  'Illness': '#3b82f6',
  'Schedule Conflict': '#10b981',
  'Transportation Issue': '#f59e0b',
  'Weather': '#8b5cf6',
  'Other': '#ec4899',
  'Not specified': '#6b7280'
};

export function CancellationsReport() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [data, setData] = useState<CancellationsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCancellationsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await fetch(`/api/reports/cancellations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cancellations report');
      }
      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching cancellations report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchCancellationsReport();
  }, [fetchCancellationsReport]);

  const handleExport = () => {
    if (!data?.cancellations) return;

    const exportData = data.cancellations.map(cancellation => ({
      'Booking ID': cancellation.id,
      'Cancelled Date': cancellation.canceled_at ? new Date(cancellation.canceled_at).toLocaleDateString() : '',
      'Cancellation Reason': cancellation.cancel_reason || 'Not specified',
      'Swimmer Name': cancellation.swimmer ? `${cancellation.swimmer.first_name} ${cancellation.swimmer.last_name}` : '',
      'Session Date': cancellation.session?.start_time ? new Date(cancellation.session.start_time).toLocaleDateString() : '',
      'Created Date': new Date(cancellation.created_at).toLocaleDateString()
    }));

    exportToCSV(exportData, 'cancellations_report');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading cancellations report: {error}</p>
            <Button onClick={fetchCancellationsReport} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reasonData = data?.byReason ? Object.entries(data.byReason).map(([reason, count]) => ({
    name: reason,
    value: count,
    color: reasonColors[reason] || reasonColors['Other']
  })) : [];

  const swimmerData = data?.bySwimmer?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Button onClick={handleExport} disabled={!data?.cancellations?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.cancellationRate || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              of {data?.totalBookings || 0} total bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Cancellations</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.lateCancellations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.total ? `${((data.lateCancellations / data.total) * 100).toFixed(1)}% of cancellations` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Cancellations</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.regularCancellations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.total ? `${((data.regularCancellations / data.total) * 100).toFixed(1)}% of cancellations` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.byDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Cancellations" stroke="#ef4444" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellations by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Swimmers by Cancellations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>Cancellations</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swimmerData.map((swimmer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{swimmer.name}</TableCell>
                      <TableCell>{swimmer.count}</TableCell>
                      <TableCell>
                        {data?.total ? `${((swimmer.count / data.total) * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {swimmerData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No cancellation data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Cancelled Date</TableHead>
                    <TableHead>Session Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.cancellations?.slice(0, 10).map((cancellation) => (
                    <TableRow key={cancellation.id}>
                      <TableCell className="font-mono text-xs">{cancellation.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        {cancellation.swimmer ? `${cancellation.swimmer.first_name} ${cancellation.swimmer.last_name}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {cancellation.cancel_reason || 'Not specified'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {cancellation.canceled_at ? new Date(cancellation.canceled_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {cancellation.session?.start_time ? new Date(cancellation.session.start_time).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.cancellations || data.cancellations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No cancellations found for the selected date range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}