'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Calendar,
  Award,
  Phone,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface Swimmer {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  enrollmentStatus: string;
  assessmentStatus: string;
  currentLevel?: {
    id: string;
    name: string;
    displayName: string;
    color?: string;
  } | null;
  paymentType: string;
  hasFundingAuthorization: boolean;
  photoUrl?: string;
  authorizedSessionsUsed?: number;
  authorizedSessionsTotal?: number;
  currentAuthorizationNumber?: string;
  authorizationExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
  lessonsCompleted: number;
  nextSession?: {
    startTime: string;
    instructorName?: string;
  } | null;
}

export interface SwimmersTableProps {
  apiEndpoint: string; // '/api/admin/swimmers' or '/api/instructor/swimmers'
  title?: string;
  showParentInfo?: boolean;
  showActions?: boolean;
}

export interface SwimmersResponse {
  swimmers: Swimmer[];
  total: number;
  page: number;
  totalPages: number;
}

// Status badge colors
const statusColors: Record<string, string> = {
  enrolled: 'bg-green-100 text-green-800 border-green-200',
  waitlist: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  dropped: 'bg-red-100 text-red-800 border-red-200',
};

// Payment type colors
const paymentColors: Record<string, string> = {
  private_pay: 'bg-blue-100 text-blue-800 border-blue-200',
  funded: 'bg-purple-100 text-purple-800 border-purple-200',
  scholarship: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Status display names
const statusDisplay: Record<string, string> = {
  enrolled: 'Enrolled',
  waitlist: 'Waitlist',
  pending: 'Pending',
  inactive: 'Inactive',
  dropped: 'Dropped',
};

// Payment type display names
const paymentDisplay: Record<string, string> = {
  private_pay: 'Private Pay',
  funded: 'Funded',
  scholarship: 'Scholarship',
  other: 'Other',
};

export function SwimmersTable({
  apiEndpoint,
  title = 'Swimmers',
  showParentInfo = true,
  showActions = true,
}: SwimmersTableProps) {
  // State
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fundingFilter, setFundingFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch swimmers
  const fetchSwimmers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fundingFilter !== 'all') params.set('funding', fundingFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);

      const response = await fetch(`${apiEndpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch swimmers: ${response.statusText}`);
      }

      const data: SwimmersResponse = await response.json();

      setSwimmers(data.swimmers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching swimmers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch swimmers');
      setSwimmers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, search, statusFilter, fundingFilter, levelFilter, sortBy, sortOrder, page, limit]);

  // Initial fetch
  useEffect(() => {
    fetchSwimmers();
  }, [fetchSwimmers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1); // Reset to first page when searching
      fetchSwimmers();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, statusFilter, fundingFilter, levelFilter, sortBy, sortOrder, limit, page, fetchSwimmers]);

  // Handle page changes
  useEffect(() => {
    fetchSwimmers();
  }, [page, fetchSwimmers]);

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };


  // Format next session
  const formatNextSession = (nextSession?: { startTime: string; instructorName?: string }) => {
    if (!nextSession?.startTime) return 'No upcoming sessions';

    const date = new Date(nextSession.startTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayDisplay = '';
    if (date.toDateString() === today.toDateString()) {
      dayDisplay = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayDisplay = 'Tomorrow';
    } else {
      dayDisplay = date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dayDisplay} ${time}`;
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Render loading state
  if (loading && swimmers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading swimmers...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && swimmers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="text-destructive mb-2">Error loading swimmers</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          <Button onClick={fetchSwimmers}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total: {total.toLocaleString()}</span>
            <span>•</span>
            <span>Showing: {swimmers.length}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search swimmers or parents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Funding Filter */}
            <div>
              <Select value={fundingFilter} onValueChange={setFundingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Funding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Funding Types</SelectItem>
                  <SelectItem value="private_pay">Private Pay</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">No Level Assigned</SelectItem>
                  {/* Note: In a real app, you would fetch levels from API */}
                  <SelectItem value="white">White - Water Readiness</SelectItem>
                  <SelectItem value="red">Red - Body Position</SelectItem>
                  <SelectItem value="yellow">Yellow - Forward Movement</SelectItem>
                  <SelectItem value="green">Green - Water Competency</SelectItem>
                  <SelectItem value="blue">Blue - Streamlines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results per page */}
            <div>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Results per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Swimmer
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {sortBy === 'age' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort('lessons')}
                  >
                    Lessons
                    {sortBy === 'lessons' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort('nextSession')}
                  >
                    Next Session
                    {sortBy === 'nextSession' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                {showParentInfo && <TableHead>Parent</TableHead>}
                {showActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {swimmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showParentInfo && showActions ? 9 : 7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No swimmers found matching your filters.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                swimmers.map((swimmer) => (
                  <TableRow key={swimmer.id}>
                    {/* Swimmer Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={swimmer.photoUrl} alt={swimmer.fullName} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(swimmer.firstName, swimmer.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{swimmer.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {swimmer.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Age */}
                    <TableCell>
                      {swimmer.age ? `${swimmer.age} yrs` : 'N/A'}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          statusColors[swimmer.enrollmentStatus] ||
                            'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        {statusDisplay[swimmer.enrollmentStatus] || swimmer.enrollmentStatus}
                      </Badge>
                    </TableCell>

                    {/* Level */}
                    <TableCell>
                      {swimmer.currentLevel ? (
                        <Badge
                          variant="outline"
                          className="border-blue-200"
                          style={{
                            backgroundColor: swimmer.currentLevel.color
                              ? `${swimmer.currentLevel.color}20`
                              : undefined,
                            color: swimmer.currentLevel.color || undefined,
                          }}
                        >
                          {swimmer.currentLevel.displayName}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No level</span>
                      )}
                    </TableCell>

                    {/* Funding */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          paymentColors[swimmer.paymentType] ||
                            'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        {paymentDisplay[swimmer.paymentType] || swimmer.paymentType}
                        {swimmer.hasFundingAuthorization && ' (Funded)'}
                      </Badge>
                    </TableCell>

                    {/* Lessons */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{swimmer.lessonsCompleted}</span>
                        {swimmer.hasFundingAuthorization && swimmer.authorizedSessionsTotal && (
                          <span className="text-xs text-muted-foreground">
                            ({swimmer.authorizedSessionsUsed || 0}/{swimmer.authorizedSessionsTotal})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Next Session */}
                    <TableCell>
                      {swimmer.nextSession ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-green-600" />
                            <span className="font-medium">
                              {formatNextSession(swimmer.nextSession)}
                            </span>
                          </div>
                          {swimmer.nextSession.instructorName && (
                            <div className="text-xs text-muted-foreground">
                              with {swimmer.nextSession.instructorName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No upcoming</span>
                      )}
                    </TableCell>

                    {/* Parent Info */}
                    {showParentInfo && (
                      <TableCell>
                        {swimmer.parent ? (
                          <div className="space-y-1">
                            <div className="font-medium">{swimmer.parent.fullName}</div>
                            <div className="text-xs space-y-0.5">
                              {swimmer.parent.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {swimmer.parent.email}
                                </div>
                              )}
                              {swimmer.parent.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {swimmer.parent.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No parent info</span>
                        )}
                      </TableCell>
                    )}

                    {/* Actions */}
                    {showActions && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {total.toLocaleString()} total swimmers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 text-sm">Page {page}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}