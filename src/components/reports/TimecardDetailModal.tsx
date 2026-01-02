'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Edit, Clock, Calendar, DollarSign } from 'lucide-react';

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

interface TimecardDetailModalProps {
  summary: InstructorSummary;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  weekRange: { start: Date; end: Date };
}

export function TimecardDetailModal({
  summary,
  open,
  onClose,
  onUpdated,
  weekRange,
}: TimecardDetailModalProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      approved: 'bg-green-100 text-green-800 hover:bg-green-100',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-100'
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />
    };
    return (
      <Badge className={colors[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEditHours = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setHoursWorked(entry.hours_worked?.toString() || '');
    setNotes(entry.notes || '');
  };

  const handleSaveHours = async () => {
    if (!editingEntry) return;

    try {
      setSaving(true);

      const hours = parseFloat(hoursWorked);
      if (isNaN(hours) || hours < 0) {
        toast({
          title: 'Error',
          description: 'Please enter valid hours',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/reports/timecards/${editingEntry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursWorked: hours,
          notes: notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update time entry');
      }

      toast({
        title: 'Success',
        description: 'Time entry updated successfully',
      });

      setEditingEntry(null);
      onUpdated();
    } catch (error: any) {
      console.error('Error updating time entry:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update time entry',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReject = async (entryId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/reports/timecards/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${status} entry`);
      }

      toast({
        title: 'Success',
        description: `Time entry ${status} successfully`,
      });

      onUpdated();
    } catch (error: any) {
      console.error(`Error ${status}ing time entry:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${status} entry`,
        variant: 'destructive',
      });
    }
  };

  const formatPayRate = (cents: number) => `$${(cents / 100).toFixed(2)}/hr`;
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timecard Details</DialogTitle>
          <DialogDescription>
            {summary.instructor.full_name} - Week of{' '}
            {weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to{' '}
            {weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {/* Instructor Summary */}
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pay Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatPayRate(summary.instructor.pay_rate_cents)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{summary.totalHours.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold text-green-600">
                {formatCurrency(summary.totalPay)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries Table */}
        <div className="space-y-4">
          <h3 className="font-medium">Time Entries</h3>
          {summary.timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries for this week
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{formatTime(entry.clock_in)}</TableCell>
                    <TableCell>
                      {entry.clock_out ? formatTime(entry.clock_out) : 'Not clocked out'}
                    </TableCell>
                    <TableCell>
                      {editingEntry?.id === entry.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={hoursWorked}
                          onChange={(e) => setHoursWorked(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        <span className="font-medium">
                          {entry.hours_worked?.toFixed(2) || '0.00'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingEntry?.id === entry.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveHours} disabled={saving}>
                              {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEntry(null)}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditHours(entry)}
                              disabled={entry.status === 'approved' || entry.status === 'rejected'}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            {entry.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApproveReject(entry.id, 'approved')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleApproveReject(entry.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Notes for Editing Entry */}
        {editingEntry && (
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this time entry..."
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper components
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-4 ${className}`}>{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 pt-0 ${className}`}>{children}</div>;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</div>;
}