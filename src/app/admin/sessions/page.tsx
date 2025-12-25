'use client';

import { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Loader2, Calendar, FilterX, Plus, MoreHorizontal, Eye, Edit, UserPlus, Users, XCircle, CheckCircle, Trash2, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAllSessions, useOpenSessions, useDeleteSessions, useInstructors } from '@/hooks';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Import booking modals (we'll need to adapt them for sessions)
import { BookingDetailsModal } from '@/components/bookings/BookingDetailsModal';
import { EditBookingModal } from '@/components/bookings/EditBookingModal';
import { ChangeInstructorModal } from '@/components/bookings/ChangeInstructorModal';
import { RescheduleModal } from '@/components/bookings/RescheduleModal';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';

function AdminSessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const statusFilter = searchParams.get('status') || 'all';

  // Fetch data
  const { data, isLoading, error, refetch } = useAllSessions();
  const { data: instructorsData } = useInstructors();
  const { mutate: openSessions, isPending: isOpening } = useOpenSessions();
  const { mutate: deleteSessions, isPending: isDeleting } = useDeleteSessions();

  // State
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    timeFilter: 'all',
    instructorFilter: 'all',
    locationFilter: 'all',
    search: '',
  });

  // Modal states
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [changingInstructor, setChangingInstructor] = useState<any>(null);
  const [reschedulingSession, setReschedulingSession] = useState<any>(null);
  const [cancellingSession, setCancellingSession] = useState<any>(null);
  const [bookingSession, setBookingSession] = useState<any>(null);
  const [bulkChangingInstructor, setBulkChangingInstructor] = useState(false);

  // Get all sessions
  const allSessions = useMemo(() => data?.sessions || [], [data]);

  // Filter sessions based on status and filters
  const filteredSessions = useMemo(() => {
    let filtered = allSessions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Apply date range filter
    if (filters.startDate) {
      const start = startOfDay(parseISO(filters.startDate));
      filtered = filtered.filter(s => {
        const sessionDate = parseISO(s.start_time);
        return sessionDate >= start;
      });
    }

    if (filters.endDate) {
      const end = endOfDay(parseISO(filters.endDate));
      filtered = filtered.filter(s => {
        const sessionDate = parseISO(s.start_time);
        return sessionDate <= end;
      });
    }

    // Apply time of day filter
    if (filters.timeFilter !== 'all') {
      filtered = filtered.filter(s => {
        const hour = parseISO(s.start_time).getHours();
        if (filters.timeFilter === 'morning') return hour >= 6 && hour < 12;
        if (filters.timeFilter === 'afternoon') return hour >= 12 && hour < 17;
        if (filters.timeFilter === 'evening') return hour >= 17 && hour < 22;
        return true;
      });
    }

    // Apply instructor filter
    if (filters.instructorFilter !== 'all') {
      filtered = filtered.filter(s => s.instructor_id === filters.instructorFilter);
    }

    // Apply location filter
    if (filters.locationFilter !== 'all') {
      filtered = filtered.filter(s => s.location === filters.locationFilter);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(s => {
        const instructorName = s.instructor_name?.toLowerCase() || '';
        const swimmerNames = s.bookings?.map(b =>
          `${b.swimmer?.first_name} ${b.swimmer?.last_name}`.toLowerCase()
        ).join(' ') || '';

        return instructorName.includes(searchLower) ||
               swimmerNames.includes(searchLower) ||
               s.location.toLowerCase().includes(searchLower);
      });
    }

    return filtered;
  }, [allSessions, statusFilter, filters]);

  // Calculate statistics
  const stats = useMemo(() => data?.stats || {
    total: 0,
    draft: 0,
    open: 0,
    booked: 0,
    completed: 0,
    cancelled: 0,
    no_shows: 0,
  }, [data]);

  // Get unique locations
  const locations = useMemo(() => {
    const locs = new Set<string>();
    allSessions.forEach(s => locs.add(s.location));
    return Array.from(locs);
  }, [allSessions]);

  // Selection handlers
  const handleSelectSession = (sessionId: string, selected: boolean) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.size === filteredSessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(filteredSessions.map(s => s.id)));
    }
  };

  // Action handlers
  const handleOpenSelected = () => {
    if (selectedSessionIds.size === 0) {
      toast({
        title: 'No sessions selected',
        description: 'Please select at least one session to open.',
        variant: 'destructive',
      });
      return;
    }

    openSessions(
      { sessionIds: Array.from(selectedSessionIds) },
      {
        onSuccess: (result) => {
          toast({
            title: 'Sessions opened successfully',
            description: `${result.count} session${result.count !== 1 ? 's' : ''} are now available for booking.`,
          });
          setSelectedSessionIds(new Set());
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Failed to open sessions',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteSelected = () => {
    if (selectedSessionIds.size === 0) {
      toast({
        title: 'No sessions selected',
        description: 'Please select at least one session to delete.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSessionIds.size} session${selectedSessionIds.size !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    deleteSessions(
      { sessionIds: Array.from(selectedSessionIds) },
      {
        onSuccess: (result) => {
          toast({
            title: 'Sessions deleted successfully',
            description: `${result.count} session${result.count !== 1 ? 's' : ''} have been deleted.`,
          });
          setSelectedSessionIds(new Set());
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Failed to delete sessions',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleBulkComplete = () => {
    // TODO: Implement bulk complete
    toast({
      title: 'Feature coming soon',
      description: 'Bulk mark as completed will be implemented soon.',
    });
  };

  const handleBulkCancel = () => {
    // TODO: Implement bulk cancel
    toast({
      title: 'Feature coming soon',
      description: 'Bulk cancel will be implemented soon.',
    });
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    router.push(`/admin/sessions?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      timeFilter: 'all',
      instructorFilter: 'all',
      locationFilter: 'all',
      search: '',
    });
  };

  const exportToCSV = () => {
    const csvData = filteredSessions.map(s => ({
      'Date': format(parseISO(s.start_time), 'yyyy-MM-dd'),
      'Time': format(parseISO(s.start_time), 'h:mm a'),
      'End Time': format(parseISO(s.end_time), 'h:mm a'),
      'Location': s.location,
      'Instructor': s.instructor_name || 'Unassigned',
      'Status': s.status,
      'Capacity': `${s.booking_count || 0}/${s.max_capacity}`,
      'Swimmers': s.bookings?.map(b => `${b.swimmer?.first_name} ${b.swimmer?.last_name}`).join('; ') || '',
      'Type': s.session_type
    }));

    if (csvData.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no sessions to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Export successful',
      description: `Exported ${csvData.length} sessions to CSV.`,
    });
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sessions...</span>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load sessions: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Session Management</h1>
            <p className="text-muted-foreground">
              View and manage all sessions with full booking details
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={() => router.push('/admin/sessions/generate')}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Sessions
            </Button>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-green-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Booked</p>
              <p className="text-2xl font-bold text-blue-600">{stats.booked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold text-orange-600">{stats.cancelled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">No-Shows</p>
              <p className="text-2xl font-bold text-red-600">{stats.no_shows}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={statusFilter} onValueChange={handleStatusChange}>
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="all" className="flex flex-col items-center gap-1">
                  <span>All</span>
                  <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="flex flex-col items-center gap-1">
                  <span>Drafts</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">{stats.draft}</Badge>
                </TabsTrigger>
                <TabsTrigger value="open" className="flex flex-col items-center gap-1">
                  <span>Open</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">{stats.open}</Badge>
                </TabsTrigger>
                <TabsTrigger value="booked" className="flex flex-col items-center gap-1">
                  <span>Booked</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">{stats.booked}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex flex-col items-center gap-1">
                  <span>Completed</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">{stats.completed}</Badge>
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex flex-col items-center gap-1">
                  <span>Cancelled</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">{stats.cancelled}</Badge>
                </TabsTrigger>
                <TabsTrigger value="no_show" className="flex flex-col items-center gap-1">
                  <span>No-Shows</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">{stats.no_shows}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter sessions by date, time, instructor, location, or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Date Range */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-32"
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-32"
                  placeholder="End date"
                />
              </div>

              {/* Time of Day */}
              <Select value={filters.timeFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, timeFilter: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>

              {/* Instructor */}
              <Select value={filters.instructorFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, instructorFilter: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructorsData?.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location */}
              <Select value={filters.locationFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, locationFilter: value }))}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <Input
                placeholder="Search swimmer or instructor..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />

              {/* Clear Filters */}
              <Button variant="outline" onClick={clearFilters}>
                <FilterX className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>
                  {statusFilter === 'all' && 'All Sessions'}
                  {statusFilter === 'draft' && 'Draft Sessions'}
                  {statusFilter === 'open' && 'Open Sessions'}
                  {statusFilter === 'booked' && 'Booked Sessions'}
                  {statusFilter === 'completed' && 'Completed Sessions'}
                  {statusFilter === 'cancelled' && 'Cancelled Sessions'}
                  {statusFilter === 'no_show' && 'No-Show Sessions'}
                </CardTitle>
                <CardDescription>
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSessionIds.size} of {filteredSessions.length} selected
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Bulk Actions */}
            {selectedSessionIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSessionIds.size === filteredSessions.length && filteredSessions.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all sessions"
                  />
                  <span className="text-sm font-medium">
                    {selectedSessionIds.size === filteredSessions.length ? 'Deselect All' : 'Select All'}
                  </span>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex flex-wrap gap-2">
                  {statusFilter === 'draft' && (
                    <Button
                      onClick={handleOpenSelected}
                      disabled={selectedSessionIds.size === 0 || isOpening}
                      className="gap-2"
                    >
                      {isOpening && <Loader2 className="h-4 w-4 animate-spin" />}
                      Open Selected ({selectedSessionIds.size})
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setBulkChangingInstructor(true)}
                    disabled={selectedSessionIds.size === 0}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Change Instructor
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleBulkComplete}
                    disabled={selectedSessionIds.size === 0}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Completed
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleBulkCancel}
                    disabled={selectedSessionIds.size === 0}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={selectedSessionIds.size === 0 || isDeleting}
                    className="gap-2"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete Selected ({selectedSessionIds.size})
                  </Button>

                  {selectedSessionIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSessionIds(new Set())}
                      className="gap-2"
                    >
                      <FilterX className="h-4 w-4" />
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'draft'
                    ? 'No draft sessions found. Generate sessions to create drafts.'
                    : `No ${statusFilter} sessions found.`}
                </p>
                {statusFilter === 'draft' && (
                  <Button onClick={() => router.push('/admin/sessions/generate')}>
                    Generate Sessions
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedSessionIds.has(session.id)}
                      onCheckedChange={(checked) => handleSelectSession(session.id, !!checked)}
                      aria-label={`Select session ${session.id}`}
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium">
                          {format(parseISO(session.start_time), 'EEEE, MMMM d, yyyy')}
                        </span>
                        <span className="text-muted-foreground">
                          {format(parseISO(session.start_time), 'h:mm a')} - {format(parseISO(session.end_time), 'h:mm a')}
                        </span>
                        <Badge variant="outline">{session.location}</Badge>

                        {/* Status Badge */}
                        {session.status === 'draft' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            Draft
                          </Badge>
                        )}
                        {session.status === 'open' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            Open
                          </Badge>
                        )}
                        {session.status === 'booked' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Booked
                          </Badge>
                        )}
                        {session.status === 'completed' && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                            Completed
                          </Badge>
                        )}
                        {session.status === 'cancelled' && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            Cancelled
                          </Badge>
                        )}
                        {session.status === 'no_show' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            No-Show
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground mb-2">
                        <span>Instructor: {session.instructor_name || 'Unknown'}</span>
                        <span className="mx-2">•</span>
                        <span>Capacity: {session.booking_count || 0}/{session.max_capacity}</span>
                        <span className="mx-2">•</span>
                        <span>Type: {session.session_type}</span>
                      </div>

                      {/* Booking Info */}
                      {session.bookings && session.bookings.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Booked: </span>
                          {session.bookings.map((b, i) => (
                            <span key={b.id}>
                              {i > 0 && ', '}
                              <span className={b.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}>
                                {b.swimmer?.first_name} {b.swimmer?.last_name}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingSession(session)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingSession(session)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit Session
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setChangingInstructor(session)}>
                          <Users className="h-4 w-4 mr-2" /> Change Instructor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReschedulingSession(session)}>
                          <Calendar className="h-4 w-4 mr-2" /> Reschedule
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {session.status === 'draft' && (
                          <DropdownMenuItem onClick={() => {
                            openSessions(
                              { sessionIds: [session.id] },
                              {
                                onSuccess: () => {
                                  toast({
                                    title: 'Session opened',
                                    description: 'Session is now available for booking.',
                                  });
                                  refetch();
                                },
                              }
                            );
                          }}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Open for Booking
                          </DropdownMenuItem>
                        )}

                        {session.status === 'open' && (
                          <DropdownMenuItem onClick={() => setBookingSession(session)}>
                            <UserPlus className="h-4 w-4 mr-2" /> Book Client
                          </DropdownMenuItem>
                        )}

                        {session.bookings?.length > 0 && (
                          <DropdownMenuItem onClick={() => {
                            // TODO: Implement mark completed
                            toast({
                              title: 'Feature coming soon',
                              description: 'Mark as completed will be implemented soon.',
                            });
                          }}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setCancellingSession(session)}
                          className="text-orange-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this session?')) {
                              deleteSessions(
                                { sessionIds: [session.id] },
                                {
                                  onSuccess: () => {
                                    toast({
                                      title: 'Session deleted',
                                      description: 'Session has been deleted.',
                                    });
                                    refetch();
                                  },
                                }
                              );
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Bulk Action Bar */}
        {selectedSessionIds.size > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
            <span className="font-medium">{selectedSessionIds.size} selected</span>

            {statusFilter === 'draft' && (
              <Button size="sm" onClick={handleOpenSelected}>
                Open for Booking
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setBulkChangingInstructor(true)}>
              Change Instructor
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkComplete}>
              Mark Completed
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>

            <Button size="sm" variant="ghost" onClick={() => setSelectedSessionIds(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Modals */}
        {/* TODO: Implement session-specific modals */}
        {/* For now, we'll use placeholder modals */}

      </div>
    </RoleGuard>
  );
}

export default function AdminSessionsPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sessions...</span>
        </div>
      </div>
    }>
      <AdminSessionsContent />
    </Suspense>
  );
}