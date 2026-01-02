'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, DollarSign, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  session_id: string;
  instructor_id: string;
  clock_in: string;
  clock_out: string | null;
  status: 'clocked_in' | 'clocked_out' | 'submitted' | 'approved' | 'rejected';
  hours_worked: number | null;
  pay_rate_cents: number;
  total_pay_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

export default function TimecardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    return new Date(now.setDate(diff));
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalPay: 0,
    pendingEntries: 0,
    approvedEntries: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
    }
  }, [currentWeekStart, user]);

  const fetchTimeEntries = async () => {
    setLoading(true);
    const supabase = createClient();

    if (!user) return;
    setUserId(user.id);

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('instructor_id', user.id)
      .gte('clock_in', currentWeekStart.toISOString())
      .lte('clock_in', weekEnd.toISOString())
      .order('clock_in', { ascending: false });

    const entries = data || [];
    setTimeEntries(entries);

    // Calculate stats
    const totalHours = entries.reduce((acc, entry) => acc + (entry.hours_worked || 0), 0);
    const totalPay = entries.reduce((acc, entry) => acc + (entry.total_pay_cents || 0), 0) / 100;
    const pendingEntries = entries.filter(e => e.status === 'submitted').length;
    const approvedEntries = entries.filter(e => e.status === 'approved').length;

    setStats({
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalPay: parseFloat(totalPay.toFixed(2)),
      pendingEntries,
      approvedEntries,
    });

    setLoading(false);
  };

  const handleClockIn = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('time_entries')
      .insert({
        instructor_id: userId,
        clock_in: new Date().toISOString(),
        status: 'clocked_in',
        pay_rate_cents: 2500, // $25/hour default
      });

    if (error) {
      console.error('Error clocking in:', error);
    } else {
      fetchTimeEntries();
    }
  };

  const handleClockOut = async (entryId: string) => {
    const supabase = createClient();
    const clockOutTime = new Date();

    // Get the entry to calculate hours
    const { data: entry } = await supabase
      .from('time_entries')
      .select('clock_in, pay_rate_cents')
      .eq('id', entryId)
      .single();

    if (entry) {
      const clockInTime = new Date(entry.clock_in);
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      const totalPayCents = Math.round(hoursWorked * entry.pay_rate_cents);

      const { error } = await supabase
        .from('time_entries')
        .update({
          clock_out: clockOutTime.toISOString(),
          hours_worked: parseFloat(hoursWorked.toFixed(2)),
          total_pay_cents: totalPayCents,
          status: 'clocked_out',
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error clocking out:', error);
      } else {
        fetchTimeEntries();
      }
    }
  };

  const handleSubmitForApproval = async (entryId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('time_entries')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    if (error) {
      console.error('Error submitting for approval:', error);
    } else {
      fetchTimeEntries();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Clocked In</Badge>;
      case 'clocked_out':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Clocked Out</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timecard</h1>
          <p className="text-muted-foreground">
            {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} aria-label="Previous week">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentWeek}>
            This Week
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Next week">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold mt-1">{stats.totalHours}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Pay</p>
                <p className="text-3xl font-bold mt-1">${stats.totalPay.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingEntries}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold mt-1">{stats.approvedEntries}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clock In/Out Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Current Status</h3>
              <p className="text-sm text-muted-foreground">
                {timeEntries.some(e => e.status === 'clocked_in')
                  ? 'You are currently clocked in'
                  : 'You are not clocked in'}
              </p>
            </div>
            {timeEntries.some(e => e.status === 'clocked_in') ? (
              <Button
                variant="destructive"
                onClick={() => {
                  const clockedInEntry = timeEntries.find(e => e.status === 'clocked_in');
                  if (clockedInEntry) handleClockOut(clockedInEntry.id);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <Button onClick={handleClockIn}>
                <Clock className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Time Entries</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {authLoading || loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No time entries for this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {format(new Date(entry.clock_in), 'EEEE, MMMM d')}
                        </p>
                        {getStatusBadge(entry.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.clock_in), 'h:mm a')} -{' '}
                        {entry.clock_out ? format(new Date(entry.clock_out), 'h:mm a') : 'In Progress'}
                      </p>
                      {entry.hours_worked && (
                        <p className="text-sm">
                          <span className="font-medium">{entry.hours_worked.toFixed(2)} hours</span>
                          {entry.total_pay_cents && (
                            <span className="ml-4">
                              ${(entry.total_pay_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {entry.status === 'clocked_out' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitForApproval(entry.id)}
                        >
                          Submit for Approval
                        </Button>
                      )}
                      {entry.status === 'submitted' && (
                        <p className="text-sm text-muted-foreground text-right">
                          Submitted {entry.submitted_at && format(new Date(entry.submitted_at), 'MMM d')}
                        </p>
                      )}
                      {entry.status === 'approved' && entry.approved_at && (
                        <p className="text-sm text-green-600 text-right">
                          Approved {format(new Date(entry.approved_at), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}