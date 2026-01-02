'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { exportToCSV } from '@/lib/export-csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Download, Users, Clock, XCircle, TrendingUp, TrendingDown, User, Mail } from 'lucide-react';

interface InstructorPerformanceData {
  instructor_id: string;
  instructor_name: string;
  instructor_email: string;
  total_sessions: number;
  total_bookings: number;
  unique_swimmers: number;
  avg_days_to_book: number;
  open_sessions: number;
  available_spots: number;
  total_cancellations: number;
  late_cancellations: number;
  fill_rate_percent: number;
}

interface InstructorPerformanceReportData {
  instructors: InstructorPerformanceData[];
  summary: {
    total_instructors: number;
    avg_days_to_book: number;
    total_open_sessions: number;
    total_cancellations: number;
    avg_fill_rate: number;
  };
  trends: Array<{
    week: string;
    avg_days_to_book: number;
    total_cancellations: number;
    fill_rate: number;
  }>;
}

export function InstructorPerformanceReport() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [data, setData] = useState<InstructorPerformanceReportData | null>(null);
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

      const response = await fetch(`/api/reports/instructor-performance?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching instructor performance data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!data?.instructors) return;

    const csvData = data.instructors.map(instructor => ({
      'Instructor Name': instructor.instructor_name,
      'Email': instructor.instructor_email,
      'Total Sessions': instructor.total_sessions,
      'Total Bookings': instructor.total_bookings,
      'Unique Swimmers': instructor.unique_swimmers,
      'Avg Days to Book': instructor.avg_days_to_book?.toFixed(1) || 'N/A',
      'Open Sessions': instructor.open_sessions,
      'Available Spots': instructor.available_spots,
      'Total Cancellations': instructor.total_cancellations,
      'Late Cancellations': instructor.late_cancellations,
      'Fill Rate %': instructor.fill_rate_percent?.toFixed(1) || '0'
    }));

    exportToCSV(csvData, `instructor-performance-${new Date().toISOString().split('T')[0]}`);
  };

  const getPerformanceColor = (days: number) => {
    if (days <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (days <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getFillRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getCancellationColor = (cancellations: number, totalBookings: number) => {
    const rate = totalBookings > 0 ? (cancellations / totalBookings) * 100 : 0;
    if (rate <= 10) return 'bg-green-100 text-green-800 border-green-300';
    if (rate <= 20) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

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
            <p>Error loading instructor performance data: {error}</p>
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
          <h2 className="text-2xl font-bold">Instructor Performance</h2>
          <p className="text-muted-foreground">
            Track booking velocity, open slots, and cancellation rates
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
              Avg Booking Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avg_days_to_book?.toFixed(1) || '0'} days
            </div>
            <div className="text-sm text-muted-foreground">
              Lower is better
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Open Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.total_open_sessions || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Across all instructors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Total Cancellations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.total_cancellations || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              All instructors combined
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Avg Fill Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avg_fill_rate?.toFixed(1) || '0'}%
            </div>
            <div className="text-sm text-muted-foreground">
              Higher is better
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      {data?.trends && data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Weekly trends in booking velocity and fill rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avg_days_to_book"
                    name="Avg Days to Book"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fill_rate"
                    name="Fill Rate %"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Instructor Performance Details</span>
            <div className="text-sm font-normal text-muted-foreground">
              {data?.instructors.length || 0} instructors
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Avg Days to Book</TableHead>
                  <TableHead>Open Slots</TableHead>
                  <TableHead>Fill Rate</TableHead>
                  <TableHead>Cancellations</TableHead>
                  <TableHead>Late Cancels</TableHead>
                  <TableHead>Unique Swimmers</TableHead>
                  <TableHead>Total Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.instructors.map((instructor) => (
                  <TableRow key={instructor.instructor_id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div>{instructor.instructor_name}</div>
                          {instructor.instructor_email && (
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {instructor.instructor_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPerformanceColor(instructor.avg_days_to_book || 0)}>
                        {instructor.avg_days_to_book?.toFixed(1) || 'N/A'} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{instructor.open_sessions} sessions</div>
                        <div className="text-sm text-muted-foreground">
                          {instructor.available_spots} spots available
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFillRateColor(instructor.fill_rate_percent || 0)}>
                        {instructor.fill_rate_percent?.toFixed(1) || '0'}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCancellationColor(
                        instructor.total_cancellations || 0,
                        instructor.total_bookings || 0
                      )}>
                        {instructor.total_cancellations || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-red-600">
                        {instructor.late_cancellations || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {instructor.unique_swimmers || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {instructor.total_sessions || 0}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {(!data?.instructors || data.instructors.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No instructor data available for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.instructors && data.instructors.length > 0 && (
            <>
              {/* Top performer */}
              {data.instructors[0] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-800">Top Performer</h4>
                      <p className="text-sm text-green-700">
                        <span className="font-semibold">{data.instructors[0].instructor_name}</span> has the best
                        fill rate at {data.instructors[0].fill_rate_percent?.toFixed(1)}% and
                        books sessions in {data.instructors[0].avg_days_to_book?.toFixed(1)} days on average.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Needs attention */}
              {data.instructors.filter(i => (i.avg_days_to_book || 0) > 7).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Slow Booking Velocity</h4>
                      <p className="text-sm text-yellow-700">
                        {data.instructors.filter(i => (i.avg_days_to_book || 0) > 7).length} instructor(s)
                        take more than 7 days on average to fill sessions. Consider adjusting pricing,
                        schedule, or marketing for these time slots.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* High cancellation rate */}
              {data.instructors.filter(i => {
                const rate = (i.total_cancellations || 0) / (i.total_bookings || 1) * 100;
                return rate > 20;
              }).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-red-800">High Cancellation Rates</h4>
                      <p className="text-sm text-red-700">
                        {data.instructors.filter(i => {
                          const rate = (i.total_cancellations || 0) / (i.total_bookings || 1) * 100;
                          return rate > 20;
                        }).length} instructor(s) have cancellation rates above 20%.
                        Consider reviewing cancellation policies and communication strategies.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}