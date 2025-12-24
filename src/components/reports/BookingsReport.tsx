'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { exportToCSV } from '@/lib/export-csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BookingData {
  id: string;
  status: string;
  created_at: string;
  canceled_at: string | null;
  cancel_reason: string | null;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    payment_type: string;
  } | null;
  session: {
    id: string;
    start_time: string;
    instructor_id: string;
  } | null;
}

interface BookingsReportData {
  total: number;
  byStatus: {
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  byPaymentType: {
    privatePay: number;
    regionalCenter: number;
  };
  byDate: Array<{ date: string; count: number }>;
  bookings: BookingData[];
}

const statusColors: Record<string, string> = {
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#f59e0b'
};

const paymentTypeColors: Record<string, string> = {
  privatePay: '#8b5cf6',
  regionalCenter: '#ec4899'
};

export function BookingsReport() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [data, setData] = useState<BookingsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await fetch(`/api/reports/bookings?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings report');
      }
      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching bookings report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchBookingsReport();
  }, [fetchBookingsReport]);

  const handleExport = () => {
    if (!data?.bookings) return;

    const exportData = data.bookings.map(booking => ({
      'Booking ID': booking.id,
      'Status': booking.status,
      'Created Date': new Date(booking.created_at).toLocaleDateString(),
      'Cancelled Date': booking.canceled_at ? new Date(booking.canceled_at).toLocaleDateString() : '',
      'Cancellation Reason': booking.cancel_reason || '',
      'Swimmer Name': booking.swimmer ? `${booking.swimmer.first_name} ${booking.swimmer.last_name}` : '',
      'Payment Type': booking.swimmer?.payment_type || '',
      'Session Date': booking.session?.start_time ? new Date(booking.session.start_time).toLocaleDateString() : '',
      'Session Time': booking.session?.start_time ? new Date(booking.session.start_time).toLocaleTimeString() : ''
    }));

    exportToCSV(exportData, 'bookings_report');
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
            <p>Error loading bookings report: {error}</p>
            <Button onClick={fetchBookingsReport} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusData = data ? [
    { name: 'Confirmed', value: data.byStatus.confirmed, color: statusColors.confirmed },
    { name: 'Completed', value: data.byStatus.completed, color: statusColors.completed },
    { name: 'Cancelled', value: data.byStatus.cancelled, color: statusColors.cancelled },
    { name: 'No Show', value: data.byStatus.noShow, color: statusColors.no_show }
  ] : [];

  const paymentData = data ? [
    { name: 'Private Pay', value: data.byPaymentType.privatePay, color: paymentTypeColors.privatePay },
    { name: 'Regional Center', value: data.byPaymentType.regionalCenter, color: paymentTypeColors.regionalCenter }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Button onClick={handleExport} disabled={!data?.bookings?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.byStatus.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.total ? `${((data.byStatus.confirmed / data.total) * 100).toFixed(1)}% of total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.byStatus.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.total ? `${((data.byStatus.completed / data.total) * 100).toFixed(1)}% of total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.byStatus.cancelled || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.total ? `${((data.byStatus.cancelled / data.total) * 100).toFixed(1)}% of total` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bookings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.byDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Bookings" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Swimmer</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Session Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {booking.swimmer ? `${booking.swimmer.first_name} ${booking.swimmer.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {booking.swimmer?.payment_type ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {booking.swimmer.payment_type}
                        </span>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {booking.session?.start_time ? new Date(booking.session.start_time).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.bookings || data.bookings.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bookings found for the selected date range
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}