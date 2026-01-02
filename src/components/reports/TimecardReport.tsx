'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/lib/export-csv';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Clock, DollarSign, CheckCircle, AlertCircle, Download, Users, Calendar } from 'lucide-react';
import { TimecardDetailModal } from './TimecardDetailModal';

interface TimeEntry {
  id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
  status: string;
  notes: string | null;
}

interface InstructorSummary {
  instructor: {
    id: string;
    full_name: string;
    email: string;
    pay_rate_cents: number;
    employment_type: string;
  };
  timeEntries: TimeEntry[];
  totalHours: number;
  totalPay: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface TimecardReportData {
  startDate: string;
  endDate: string;
  summaries: InstructorSummary[];
  totals: {
    totalHours: number;
    totalPay: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
}

export function TimecardReport() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // End of week (Saturday)
    return { start, end };
  });
  const [data, setData] = useState<TimecardReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorSummary | null>(null);
  const { toast } = useToast();

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPayRate = (cents: number) => `$${(cents / 100).toFixed(2)}/hr`;

  const getWeekLabel = () => {
    const start = dateRange.start;
    const end = dateRange.end;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(dateRange.start);
    const newEnd = new Date(dateRange.end);

    if (direction === 'prev') {
      newStart.setDate(newStart.getDate() - 7);
      newEnd.setDate(newEnd.getDate() - 7);
    } else {
      newStart.setDate(newStart.getDate() + 7);
      newEnd.setDate(newEnd.getDate() + 7);
    }

    setDateRange({ start: newStart, end: newEnd });
  };

  const fetchTimecards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/timecards?startDate=${formatDate(dateRange.start)}&endDate=${formatDate(dateRange.end)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch timecards');
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (error: any) {
      console.error('Error fetching timecards:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load timecard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    fetchTimecards();
  }, [fetchTimecards]);

  const handleBulkApprove = async () => {
    try {
      const response = await fetch('/api/reports/timecards/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve_all',
          startDate: formatDate(dateRange.start),
          endDate: formatDate(dateRange.end),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve entries');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
      });

      fetchTimecards();
    } catch (error: any) {
      console.error('Error approving entries:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve entries',
        variant: 'destructive',
      });
    }
  };

  const handleMarkProcessed = async () => {
    try {
      const response = await fetch('/api/reports/timecards/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_processed',
          startDate: formatDate(dateRange.start),
          endDate: formatDate(dateRange.end),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark entries as processed');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
      });

      fetchTimecards();
    } catch (error: any) {
      console.error('Error marking entries as processed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark entries as processed',
        variant: 'destructive',
      });
    }
  };

  const exportPayrollCSV = () => {
    if (!data) return;

    const csvData = data.summaries.map(summary => ({
      'Instructor': summary.instructor.full_name,
      'Email': summary.instructor.email,
      'Hours': summary.totalHours.toFixed(2),
      'Rate': (summary.instructor.pay_rate_cents / 100).toFixed(2),
      'Total Pay': summary.totalPay.toFixed(2),
      'Pending Entries': summary.pendingCount,
      'Approved Entries': summary.approvedCount,
      'Status': summary.pendingCount > 0 ? 'Pending' : 'Approved'
    }));

    const weekLabel = getWeekLabel().replace(/\s/g, '_');
    exportToCSV(csvData, `payroll_${weekLabel}`);
  };

  const getStatusBadge = (count: number, type: 'pending' | 'approved' | 'rejected') => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      approved: 'bg-green-100 text-green-800 hover:bg-green-100',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-100'
    };
    const icons = {
      pending: <AlertCircle className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <AlertCircle className="h-3 w-3 mr-1" />
    };
    return (
      <Badge className={colors[type]}>
        {icons[type]}
        {count}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{getWeekLabel()}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportPayrollCSV}
            disabled={!data || data.summaries.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleBulkApprove}
            disabled={!data || data.totals.pendingCount === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totals.totalHours.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? formatCurrency(data.totals.totalPay) : '$0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totals.pendingCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summaries.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Instructors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor Timecards</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.summaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries found for this week
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.summaries.map((summary) => (
                  <TableRow key={summary.instructor.id}>
                    <TableCell className="font-medium">
                      {summary.instructor.full_name}
                    </TableCell>
                    <TableCell>{formatPayRate(summary.instructor.pay_rate_cents)}</TableCell>
                    <TableCell className="font-semibold">
                      {summary.totalHours.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(summary.totalPay)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {getStatusBadge(summary.pendingCount, 'pending')}
                        {getStatusBadge(summary.approvedCount, 'approved')}
                        {summary.rejectedCount > 0 && getStatusBadge(summary.rejectedCount, 'rejected')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInstructor(summary)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Process Payroll Button */}
      {data && data.totals.pendingCount === 0 && data.totals.approvedCount > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleMarkProcessed}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Week as Processed for Payroll
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInstructor && (
        <TimecardDetailModal
          summary={selectedInstructor}
          open={!!selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onUpdated={fetchTimecards}
          weekRange={{ start: dateRange.start, end: dateRange.end }}
        />
      )}
    </div>
  );
}