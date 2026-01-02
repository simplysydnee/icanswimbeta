'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Loader2, Calendar, FilterX, Plus, MoreHorizontal, Eye, Edit, UserPlus, Users, XCircle, CheckCircle, Trash2, Download, X, CalendarCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAllSessions, useOpenSessions, useDeleteSessions, useInstructors } from '@/hooks';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';


// Status color helper
function getStatusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'open': return 'bg-green-100 text-green-700 border-green-300'
    case 'booked': return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'completed': return 'bg-gray-100 text-gray-700 border-gray-300'
    case 'cancelled': return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'no_show': return 'bg-red-100 text-red-700 border-red-300'
    default: return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

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
  const [openDraftsModal, setOpenDraftsModal] = useState(false);

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

  // Get unique locations - normalize inconsistent formats
  const locations = useMemo(() => {
    const locs = new Set<string>();

    allSessions.forEach(s => {
      if (!s.location) return;

      // Normalize location formats
      let normalized = s.location.trim();

      // Handle "Modesto: 1212 Kansas Ave" -> "Modesto"
      if (normalized.includes(':') && !normalized.includes('@')) {
        normalized = normalized.split(':')[0].trim();
      }

      // Handle full addresses - extract city name if it's a full address
      if (normalized.includes(', CA')) {
        // Try to extract city name from address
        const parts = normalized.split(',');
        if (parts.length >= 2) {
          // Get the city part (usually the part before state)
          const cityPart = parts[parts.length - 2].trim();
          // If it's just a city name, use it
          if (cityPart && !cityPart.includes(' ') && cityPart.length < 20) {
            normalized = cityPart;
          }
        }
      }

      // Standardize casing
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();

      locs.add(normalized);
    });

    return Array.from(locs).sort();
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

  const handleOpenAllDrafts = () => {
    const draftSessions = allSessions.filter(s => s.status === 'draft');

    if (draftSessions.length === 0) {
      toast({
        title: 'No draft sessions',
        description: 'There are no draft sessions to open.',
        variant: 'destructive',
      });
      return;
    }

    // Confirm action
    const confirmed = window.confirm(
      `Are you sure you want to open ${draftSessions.length} draft sessions for booking?`
    );

    if (!confirmed) return;

    openSessions(
      { sessionIds: draftSessions.map(s => s.id) },
      {
        onSuccess: (result) => {
          toast({
            title: 'All drafts opened successfully',
            description: `${result.count} draft session${result.count !== 1 ? 's' : ''} are now available for booking.`,
          });
          setSelectedSessionIds(new Set());
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Failed to open draft sessions',
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

    const headers = Object.keys(csvData[0] || {}) as Array<keyof typeof csvData[0]>;
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
            {/* Quick Open All Drafts - Only show if there are drafts */}
            {stats.draft > 0 && (
              <Button
                onClick={() => setOpenDraftsModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Open All Drafts ({stats.draft})
              </Button>
            )}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={() => router.push('/admin/sessions/generate')}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Sessions
            </Button>
          </div>
        </div>

        {/* Summary Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleStatusChange('all')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'draft' ? 'ring-2 ring-yellow-500' : ''
            }`}
            onClick={() => handleStatusChange('draft')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Drafts</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'open' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => handleStatusChange('open')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Open</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'booked' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleStatusChange('booked')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Booked</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.booked}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'completed' ? 'ring-2 ring-gray-500' : ''
            }`}
            onClick={() => handleStatusChange('completed')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'cancelled' ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => handleStatusChange('cancelled')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Cancelled</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.cancelled}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'no_show' ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => handleStatusChange('no_show')}
          >
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">No-Shows</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.no_shows}</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Filter Indicator */}
        {statusFilter !== 'all' && (
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="capitalize">
              Showing: {statusFilter.replace('_', '-')} sessions
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange('all')}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        )}

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filters</CardTitle>
            <p className="text-sm text-muted-foreground">Filter sessions by date, time, instructor, location, or search</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Date Range */}
              <div className="sm:col-span-2">
                <Label className="text-sm text-muted-foreground mb-2 block">Date Range</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Time of Day</Label>
                <Select value={filters.timeFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, timeFilter: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Times" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Times</SelectItem>
                    <SelectItem value="morning">Morning (6am-12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm-9pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instructor */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Instructor</Label>
                <Select value={filters.instructorFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, instructorFilter: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructorsData?.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Location</Label>
                <Select value={filters.locationFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, locationFilter: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search + Clear */}
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search swimmer or instructor..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={clearFilters} size="icon" className="shrink-0" aria-label="Clear filters">
                    <FilterX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isOpening && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Open for Booking ({selectedSessionIds.size})
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
                    variant="outline"
                    onClick={handleDeleteSelected}
                    disabled={selectedSessionIds.size === 0 || isDeleting}
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedSessionIds.size})
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
              <div className="rounded-md border overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader className="hidden sm:table-header-group">
                    <TableRow>
                      <TableHead className="w-10 px-2">
                        <Checkbox
                          checked={selectedSessionIds.size === filteredSessions.length && filteredSessions.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all sessions"
                          className="h-4 w-4"
                        />
                      </TableHead>
                      <TableHead className="px-2">Date & Time</TableHead>
                      <TableHead className="px-2 hidden md:table-cell">Location</TableHead>
                      <TableHead className="px-2">Instructor</TableHead>
                      <TableHead className="px-2 hidden lg:table-cell">Client</TableHead>
                      <TableHead className="px-2">Status</TableHead>
                      <TableHead className="px-2 hidden sm:table-cell">Capacity</TableHead>
                      <TableHead className="px-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => {
                      const booking = session.bookings?.[0] // Get first booking if exists
                      const isBooked = booking && booking.status !== 'cancelled'
                      const swimmer = booking?.swimmer

                      return (
                        <TableRow
                          key={session.id}
                          className={selectedSessionIds.has(session.id) ? 'bg-muted/50' : ''}
                        >
                          {/* Checkbox */}
                          <TableCell className="px-2 py-2">
                            <Checkbox
                              checked={selectedSessionIds.has(session.id)}
                              onCheckedChange={(checked) => handleSelectSession(session.id, !!checked)}
                              aria-label={`Select session ${session.id}`}
                              className="h-4 w-4"
                            />
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell className="px-2 py-2">
                            <div className="font-medium">
                              {format(new Date(session.start_time), 'MMM d')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="px-2 py-2 hidden md:table-cell">
                            <span className="text-xs">{session.location || '-'}</span>
                          </TableCell>

                          {/* Instructor */}
                          <TableCell className="px-2 py-2">
                            <span className="text-xs font-medium">
                              {session.instructor_name || 'Unassigned'}
                            </span>
                          </TableCell>

                          {/* Client */}
                          <TableCell className="px-2 py-2 hidden lg:table-cell">
                            {isBooked && swimmer ? (
                              <span className="text-xs font-medium text-cyan-700">
                                {swimmer.first_name} {swimmer.last_name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-2 py-2">
                            <Badge className={getStatusColor(session.status) + ' text-xs px-1.5 py-0.5'}>
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', '-')}
                            </Badge>
                          </TableCell>

                          {/* Capacity */}
                          <TableCell className="px-2 py-2 hidden sm:table-cell">
                            <span className="text-xs">
                              {session.booking_count || 0}/{session.max_capacity || 1}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-2 py-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
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

                                {session.bookings && session.bookings.length > 0 && (
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
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredSessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No sessions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
              <Button
                size="sm"
                onClick={handleOpenSelected}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
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
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteSelected}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button size="sm" variant="ghost" onClick={() => setSelectedSessionIds(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Modals */}
        {viewingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Session Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setViewingSession(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <p><strong>Date:</strong> {format(parseISO(viewingSession.start_time), 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {format(parseISO(viewingSession.start_time), 'h:mm a')} - {format(parseISO(viewingSession.end_time), 'h:mm a')}</p>
                <p><strong>Location:</strong> {viewingSession.location}</p>
                <p><strong>Instructor:</strong> {viewingSession.instructor_name || 'Unassigned'}</p>
                <p><strong>Status:</strong> {viewingSession.status}</p>
                <p><strong>Capacity:</strong> {viewingSession.booking_count || 0}/{viewingSession.max_capacity}</p>
                <p><strong>Type:</strong> {viewingSession.session_type}</p>
                {viewingSession.bookings && viewingSession.bookings.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Bookings:</p>
                    <ul className="list-disc pl-5">
                      {viewingSession.bookings.map((b: any) => (
                        <li key={b.id}>
                          {b.swimmer?.first_name} {b.swimmer?.last_name} ({b.status})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setViewingSession(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {editingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Session</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditingSession(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Edit session: {format(parseISO(editingSession.start_time), 'MMM d, yyyy h:mm a')}
              </p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Session editing functionality will be implemented soon.</p>
                  <p className="mt-2">For now, use the "Change Instructor" or "Reschedule" options for specific changes.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingSession(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Session editing will be implemented in a future update.',
                  });
                  setEditingSession(null);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {changingInstructor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Change Instructor</h2>
                <Button variant="ghost" size="sm" onClick={() => setChangingInstructor(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Change instructor for session on {format(parseISO(changingInstructor.start_time), 'MMM d, yyyy h:mm a')}
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Instructor</Label>
                  <p className="text-muted-foreground">{changingInstructor.instructor_name || 'Unassigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">New Instructor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructorsData?.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setChangingInstructor(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Instructor change will be implemented in a future update.',
                  });
                  setChangingInstructor(null);
                }}>
                  Change Instructor
                </Button>
              </div>
            </div>
          </div>
        )}

        {reschedulingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reschedule Session</h2>
                <Button variant="ghost" size="sm" onClick={() => setReschedulingSession(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Reschedule session from {format(parseISO(reschedulingSession.start_time), 'MMM d, yyyy h:mm a')}
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">New Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label className="text-sm font-medium">New Time</Label>
                  <Input type="time" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setReschedulingSession(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Session rescheduling will be implemented in a future update.',
                  });
                  setReschedulingSession(null);
                }}>
                  Reschedule
                </Button>
              </div>
            </div>
          </div>
        )}

        {cancellingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cancel Session</h2>
                <Button variant="ghost" size="sm" onClick={() => setCancellingSession(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Cancel session on {format(parseISO(cancellingSession.start_time), 'MMM d, yyyy h:mm a')}?
              </p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>This will cancel the session and notify any booked swimmers.</p>
                  <p className="mt-2"><strong>Note:</strong> This action cannot be undone.</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reason for cancellation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instructor_unavailable">Instructor unavailable</SelectItem>
                      <SelectItem value="weather">Weather</SelectItem>
                      <SelectItem value="facility_issue">Facility issue</SelectItem>
                      <SelectItem value="low_enrollment">Low enrollment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setCancellingSession(null)}>
                  Keep Session
                </Button>
                <Button variant="destructive" onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Session cancellation will be implemented in a future update.',
                  });
                  setCancellingSession(null);
                }}>
                  Cancel Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {bookingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Book Client</h2>
                <Button variant="ghost" size="sm" onClick={() => setBookingSession(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Book a client for session on {format(parseISO(bookingSession.start_time), 'MMM d, yyyy h:mm a')}
              </p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Client booking functionality will be implemented soon.</p>
                  <p className="mt-2">For now, use the parent booking interface.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setBookingSession(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Client booking will be implemented in a future update.',
                  });
                  setBookingSession(null);
                }}>
                  Book Client
                </Button>
              </div>
            </div>
          </div>
        )}

        {bulkChangingInstructor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Change Instructor (Bulk)</h2>
                <Button variant="ghost" size="sm" onClick={() => setBulkChangingInstructor(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Change instructor for {selectedSessionIds.size} selected session{selectedSessionIds.size !== 1 ? 's' : ''}
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">New Instructor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructorsData?.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setBulkChangingInstructor(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Feature coming soon',
                    description: 'Bulk instructor change will be implemented in a future update.',
                  });
                  setBulkChangingInstructor(false);
                }}>
                  Change Instructor
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Open Drafts Modal */}
        {openDraftsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-full md:max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Open Draft Sessions</h2>
                <Button variant="ghost" size="sm" onClick={() => setOpenDraftsModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-6">
                You have {stats.draft} draft session{stats.draft !== 1 ? 's' : ''}. How would you like to open them?
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => {
                    handleOpenAllDrafts();
                    setOpenDraftsModal(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Open Now
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'Feature coming soon',
                      description: 'Scheduled opening will be implemented in a future update.',
                    });
                    setOpenDraftsModal(false);
                  }}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule to Open
                </Button>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setOpenDraftsModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

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