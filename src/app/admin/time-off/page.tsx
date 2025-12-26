'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, AlertCircle, CheckCircle, XCircle, Clock, Filter, Search, CalendarOff, User, AlertTriangle, RefreshCw, XCircle as XCircleIcon } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  instructor: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  reviewer: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface SessionConflict {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  instructor_id: string;
  swimmer_count: number;
  bookings?: Array<{
    id: string;
    status: string;
    swimmer: { first_name: string; last_name: string };
    parent: { id: string; full_name: string; email: string; phone: string };
  }>;
}

const REASON_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal Day',
  family_emergency: 'Family Emergency',
  medical_appointment: 'Medical Appointment',
  other: 'Other',
};

export default function AdminTimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'declined'>('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [conflicts, setConflicts] = useState<SessionConflict[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [cancellingSession, setCancellingSession] = useState<string | null>(null);
  const [replacingSession, setReplacingSession] = useState<string | null>(null);
  const [selectedReplacements, setSelectedReplacements] = useState<Record<string, string>>({});
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    instructorId: 'all',
    search: '',
  });
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.instructorId !== 'all') params.append('instructor_id', filters.instructorId);

      const response = await fetch(`/api/admin/time-off?${params.toString()}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching time off requests:', error);
      toast({ title: 'Failed to load time off requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const fetchConflicts = useCallback(async (request: TimeOffRequest) => {
    if (!request) return;

    setLoadingConflicts(true);
    try {
      const response = await fetch(
        `/api/admin/time-off/conflicts?instructor_id=${request.instructor.id}&start_date=${request.start_date}&end_date=${request.end_date}&request_id=${request.id}`
      );
      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      setConflicts([]);
    } finally {
      setLoadingConflicts(false);
    }
  }, []);

  // Fetch available instructors for replacement
  const fetchAvailableInstructors = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/instructors');
      const data = await response.json();
      setAvailableInstructors(data.instructors || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  }, []);

  // Cancel session handler
  const handleCancelSession = async (sessionId: string) => {
    setCancellingSession(sessionId);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Cancelled due to instructor time off',
          notify_parents: true
        })
      });

      if (!response.ok) throw new Error('Failed to cancel session');

      const data = await response.json();

      if (data.notified_parents?.length > 0) {
        toast({ title: "Success", description: `Session cancelled. ${data.notified_parents.length} parent(s) notified.` });
      } else {
        toast({ title: "Success", description: `Session cancelled. ${data.cancelled_bookings} booking(s) affected.` });
      }

      // Refresh conflicts
      if (selectedRequest) {
        fetchConflicts(selectedRequest);
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to cancel session', variant: 'destructive' });
    } finally {
      setCancellingSession(null);
    }
  };

  // Replace instructor handler
  const handleReplaceInstructor = async (sessionId: string) => {
    const newInstructorId = selectedReplacements[sessionId];
    if (!newInstructorId) {
      toast({ title: "Error", description: 'Please select a replacement instructor', variant: 'destructive' });
      return;
    }

    setReplacingSession(sessionId);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/replace-instructor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_instructor_id: newInstructorId,
          notify_parents: true
        })
      });

      if (!response.ok) throw new Error('Failed to replace instructor');

      const data = await response.json();

      if (data.notified_parents?.length > 0) {
        toast({ title: "Success", description: `Instructor changed to ${data.session.instructor?.full_name}. ${data.notified_parents.length} parent(s) notified.` });
      } else {
        toast({ title: "Success", description: `Instructor changed to ${data.session.instructor?.full_name}` });
      }

      // Clear selection and refresh conflicts
      setSelectedReplacements(prev => ({ ...prev, [sessionId]: '' }));
      if (selectedRequest) {
        fetchConflicts(selectedRequest);
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to replace instructor', variant: 'destructive' });
    } finally {
      setReplacingSession(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReviewClick = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setReviewStatus('approved');
    setAdminNotes('');
    setConflicts([]);
    setSelectedReplacements({});
    fetchConflicts(request);
    fetchAvailableInstructors();
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    setReviewLoading(true);
    try {
      const response = await fetch('/api/admin/time-off', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: reviewStatus,
          adminNotes: adminNotes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }

      toast({ title: `Request ${reviewStatus} successfully` });
      setShowReviewModal(false);
      fetchRequests(); // Refresh the list
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update request', variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  };

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
            Pending Review
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

  // Get unique instructors for filter
  const instructors = Array.from(new Set(requests.map(r => r.instructor.id)))
    .map(id => {
      const request = requests.find(r => r.instructor.id === id);
      return request?.instructor;
    })
    .filter(Boolean) as TimeOffRequest['instructor'][];

  // Filter requests based on search
  const filteredRequests = requests.filter(request => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        request.instructor.full_name.toLowerCase().includes(searchLower) ||
        request.reason_type.toLowerCase().includes(searchLower) ||
        (request.notes && request.notes.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Group requests by status for tabs
  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const approvedRequests = filteredRequests.filter(r => r.status === 'approved');
  const declinedRequests = filteredRequests.filter(r => r.status === 'declined');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Time Off Requests</h1>
          <p className="text-muted-foreground">Review and manage instructor time off requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{declinedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{instructors.length}</p>
                <p className="text-sm text-muted-foreground">Instructors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or reason..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Select
                value={filters.instructorId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, instructorId: value }))}
              >
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map(instructor => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ status: 'all', instructorId: 'all', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Declined ({declinedRequests.length})
          </TabsTrigger>
        </TabsList>

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

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {!loading && pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">
                  All time off requests have been reviewed.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-200 bg-yellow-50/30">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDateRange(request)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({formatTimeRange(request)})
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.instructor.full_name}</span>
                        <span className="text-sm text-muted-foreground">• {request.instructor.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {REASON_LABELS[request.reason_type] || request.reason_type}
                        </Badge>
                      </div>
                      {request.notes && (
                        <p className="text-sm text-muted-foreground">{request.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReviewClick(request)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-4">
          {!loading && approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-blue-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Approved Requests</h3>
                <p className="text-muted-foreground">
                  No time off requests have been approved yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedRequests.map((request) => (
              <Card key={request.id} className="border-green-200 bg-green-50/30">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDateRange(request)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({formatTimeRange(request)})
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.instructor.full_name}</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {REASON_LABELS[request.reason_type] || request.reason_type}
                      </Badge>
                      {request.admin_notes && (
                        <p className="text-sm italic border-l-2 border-green-500 pl-2 mt-2">
                          Admin: {request.admin_notes}
                        </p>
                      )}
                      {request.reviewer && (
                        <p className="text-xs text-muted-foreground">
                          Approved by {request.reviewer.full_name} on {request.reviewed_at && format(new Date(request.reviewed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Declined Tab */}
        <TabsContent value="declined" className="space-y-4">
          {!loading && declinedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Declined Requests</h3>
                <p className="text-muted-foreground">
                  No time off requests have been declined.
                </p>
              </CardContent>
            </Card>
          ) : (
            declinedRequests.map((request) => (
              <Card key={request.id} className="border-red-200 bg-red-50/30">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDateRange(request)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({formatTimeRange(request)})
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.instructor.full_name}</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {REASON_LABELS[request.reason_type] || request.reason_type}
                      </Badge>
                      {request.admin_notes && (
                        <p className="text-sm italic border-l-2 border-red-500 pl-2 mt-2">
                          Admin: {request.admin_notes}
                        </p>
                      )}
                      {request.reviewer && (
                        <p className="text-xs text-muted-foreground">
                          Declined by {request.reviewer.full_name} on {request.reviewed_at && format(new Date(request.reviewed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Review Time Off Request
            </DialogTitle>
            <DialogDescription>
              Review and approve or decline this time off request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedRequest.instructor.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.instructor.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {REASON_LABELS[selectedRequest.reason_type] || selectedRequest.reason_type}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date Range</p>
                    <p className="text-sm">{formatDateRange(selectedRequest)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm">{formatTimeRange(selectedRequest)}</p>
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm font-medium">Instructor Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedRequest.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Conflict Detection */}
              {loadingConflicts ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Checking for schedule conflicts...</p>
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : conflicts.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800">Schedule Conflicts Detected</p>
                    </div>
                    <div className="text-sm text-red-700">
                      <p>This instructor has {conflicts.length} scheduled session(s) during this time off period.</p>
                      {conflicts.some(s => s.status === 'cancelled' || s.status === 'reassigned') && (
                        <p className="mt-1">
                          {conflicts.filter(s => s.status === 'cancelled' || s.status === 'reassigned').length} resolved,{' '}
                          {conflicts.filter(s => s.status !== 'cancelled' && s.status !== 'reassigned').length} need action
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Per-session actions */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Resolve Conflicts:</p>
                    {conflicts.map((session) => (
                      <div key={session.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">
                              {format(new Date(session.start_time), 'EEE, MMM d @ h:mm a')}
                            </p>
                            <p className="text-sm text-muted-foreground">{session.location}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {session.status === 'cancelled' ? (
                              <Badge className="bg-gray-100 text-gray-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Cancelled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-50">
                                {session.bookings?.filter((b: any) => b.status !== 'cancelled').length || session.swimmer_count || 0} booked
                              </Badge>
                            )}
                            {session.status === 'reassigned' && (
                              <Badge className="bg-blue-50 text-blue-700">
                                <Users className="h-3 w-3 mr-1" />
                                Reassigned
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action buttons for this specific session - only show if not already resolved */}
                        {session.status !== 'cancelled' && session.status !== 'reassigned' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t">
                            {/* Replace Instructor */}
                            <div className="flex gap-2 flex-1">
                              <Select
                                value={selectedReplacements[session.id] || ''}
                                onValueChange={(value) => setSelectedReplacements(prev => ({ ...prev, [session.id]: value }))}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select replacement..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableInstructors
                                    .filter(i => i.id !== selectedRequest?.instructor.id)
                                    .map(i => (
                                      <SelectItem key={i.id} value={i.id}>
                                        {i.full_name}
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleReplaceInstructor(session.id)}
                                disabled={!selectedReplacements[session.id] || replacingSession === session.id}
                                className="whitespace-nowrap"
                              >
                                {replacingSession === session.id ? (
                                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Replacing...</>
                                ) : (
                                  <><Users className="h-4 w-4 mr-2" /> Replace & Notify</>
                                )}
                              </Button>
                            </div>

                            {/* Cancel Session */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelSession(session.id)}
                              disabled={cancellingSession === session.id}
                            >
                              {cancellingSession === session.id ? (
                                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</>
                              ) : (
                                <><XCircleIcon className="h-4 w-4 mr-2" /> Cancel Session & Notify Parents</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">No Schedule Conflicts</p>
                  </div>
                  <p className="text-sm text-green-700">
                    No scheduled sessions found during this time off period.
                  </p>
                </div>
              )}

              {/* Review Actions */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={reviewStatus === 'approved' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setReviewStatus('approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewStatus === 'declined' ? 'destructive' : 'outline'}
                    className="w-full"
                    onClick={() => setReviewStatus('declined')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes for the instructor..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes will be visible to the instructor.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)} disabled={reviewLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={reviewLoading}>
              {reviewLoading ? 'Processing...' : `Confirm ${reviewStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}