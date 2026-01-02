'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, Clock, CalendarOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { TimeOffRequestModal } from '@/components/instructor/TimeOffRequestModal';

interface TimeOffRequest {
  id: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason_type: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'declined';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal Day',
  family_emergency: 'Family Emergency',
  medical_appointment: 'Medical Appointment',
  other: 'Other',
};

export default function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/instructor/time-off');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching time off requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDateRange = (request: TimeOffRequest) => {
    const start = format(new Date(request.start_date), 'MMM d, yyyy');
    const end = format(new Date(request.end_date), 'MMM d, yyyy');

    if (request.start_date === request.end_date) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const formatTimeRange = (request: TimeOffRequest) => {
    if (request.is_all_day) return 'All Day';
    if (request.start_time && request.end_time) {
      return `${request.start_time} - ${request.end_time}`;
    }
    return 'All Day';
  };

  // Separate requests into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRequests = requests.filter(r => new Date(r.end_date) >= today);
  const pastRequests = requests.filter(r => new Date(r.end_date) < today);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Time Off Requests</h1>
          <p className="text-muted-foreground">View and manage your time off requests</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {upcomingRequests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Upcoming Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Requests */}
      {!loading && upcomingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming & Pending</h2>
          {upcomingRequests.map((request) => (
            <Card key={request.id} className={
              request.status === 'declined' ? 'border-red-200 bg-red-50/30' :
              request.status === 'approved' ? 'border-green-200 bg-green-50/30' :
              'border-yellow-200 bg-yellow-50/30'
            }>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CalendarOff className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDateRange(request)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({formatTimeRange(request)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {REASON_LABELS[request.reason_type] || request.reason_type}
                      </Badge>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    )}
                    {request.admin_notes && (
                      <p className="text-sm italic border-l-2 border-primary pl-2 mt-2">
                        Admin: {request.admin_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    <p className="text-xs text-muted-foreground">
                      Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                    {request.reviewed_at && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed {format(new Date(request.reviewed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past Requests */}
      {!loading && pastRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">Past Requests</h2>
          {pastRequests.map((request) => (
            <Card key={request.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarOff className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDateRange(request)}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {REASON_LABELS[request.reason_type] || request.reason_type}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Time Off Requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any time off requests yet.
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Time Off
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Modal */}
      <TimeOffRequestModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmitted={fetchRequests}
      />
    </div>
  );
}