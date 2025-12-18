'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { differenceInYears, parseISO } from 'date-fns';
import { StatusBadge, getStatusOptions } from './StatusBadge';
import { SwimmerDetailModal } from './SwimmerDetailModal';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  approvalStatus?: string;
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
  vmrcSessionsUsed?: number;
  vmrcSessionsAuthorized?: number;
  vmrcCurrentPosNumber?: string;
  vmrcPosExpiresAt?: string;
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
  // Additional fields for expanded view
  diagnosis?: string[];
  swimGoals?: string[];
  hasAllergies?: boolean;
  allergiesDescription?: string;
  hasMedicalConditions?: boolean;
  medicalConditionsDescription?: string;
  historyOfSeizures?: boolean;
  toiletTrained?: boolean;
  nonAmbulatory?: boolean;
  selfInjuriousBehavior?: boolean;
  selfInjuriousDescription?: string;
  aggressiveBehavior?: boolean;
  aggressiveBehaviorDescription?: string;
  elopementHistory?: boolean;
  elopementDescription?: string;
  previousSwimLessons?: boolean;
  comfortableInWater?: string;
  flexibleSwimmer?: boolean;
  signedWaiver?: boolean;
  photoRelease?: boolean;
}

interface SwimmersResponse {
  swimmers: Swimmer[];
  total: number;
  page: number;
  totalPages: number;
}

interface SwimmerManagementTableProps {
  role: 'admin' | 'instructor';
}

// Filter options - using standardized status configurations
const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  ...getStatusOptions('enrollment')
];

const fundingOptions = [
  { label: 'All Funding', value: 'all' },
  ...getStatusOptions('funding')
];

const levelOptions = [
  { label: 'All Levels', value: 'all' },
  { label: 'No Level Assigned', value: 'none' },
  { label: 'White - Water Readiness', value: 'white' },
  { label: 'Red - Body Position', value: 'red' },
  { label: 'Yellow - Forward Movement', value: 'yellow' },
  { label: 'Green - Water Competency', value: 'green' },
  { label: 'Blue - Streamlines', value: 'blue' },
];

const pageSizeOptions = [
  { label: '25 per page', value: '25' },
  { label: '50 per page', value: '50' },
  { label: '100 per page', value: '100' },
];


// Column definitions
interface Column {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

const columns: Column[] = [
  { key: 'swimmer', label: 'Swimmer', sortable: false, width: 'w-[250px]' },
  { key: 'age', label: 'Age', sortable: true, width: 'w-[80px]' },
  { key: 'parent', label: 'Parent', sortable: false, width: 'w-[200px]' },
  { key: 'status', label: 'Status', sortable: true, width: 'w-[120px]' },
  { key: 'funding', label: 'Funding', sortable: true, width: 'w-[120px]' },
  { key: 'level', label: 'Level', sortable: true, width: 'w-[120px]' },
  { key: 'lessons', label: 'Lessons', sortable: true, width: 'w-[100px]' },
  { key: 'nextSession', label: 'Next Session', sortable: true, width: 'w-[150px]' },
];

export function SwimmerManagementTable({ role }: SwimmerManagementTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get filter values from URL or defaults
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const funding = searchParams.get('funding') || 'all';
  const level = searchParams.get('level') || 'all';
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  // Calculate total pages
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  // Create query string from current filters
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  // Update URL with new filter
  const updateFilter = (key: string, value: string | null) => {
    const queryString = createQueryString({ [key]: value, page: '1' });
    router.push(`${pathname}?${queryString}`);
  };

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParams.get('search')) {
        updateFilter('search', search || null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch swimmers
  const fetchSwimmers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiEndpoint = role === 'admin'
        ? '/api/admin/swimmers'
        : '/api/instructor/swimmers';

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (funding !== 'all') params.set('funding', funding);
      if (level !== 'all') params.set('level', level);

      const response = await fetch(`${apiEndpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch swimmers: ${response.statusText}`);
      }

      const data: SwimmersResponse = await response.json();

      setSwimmers(data.swimmers);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching swimmers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch swimmers');
      setSwimmers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [role, search, status, funding, level, sortBy, sortOrder, page, limit]);

  // Initial fetch
  useEffect(() => {
    fetchSwimmers();
  }, [fetchSwimmers]);

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (!columns.find(c => c.key === columnKey)?.sortable) return;

    const newSortOrder = sortBy === columnKey
      ? (sortOrder === 'asc' ? 'desc' : 'asc')
      : 'asc';

    const queryString = createQueryString({
      sortBy: columnKey,
      sortOrder: newSortOrder,
      page: '1'
    });
    router.push(`${pathname}?${queryString}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const queryString = createQueryString({ page: newPage.toString() });
    router.push(`${pathname}?${queryString}`);
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const queryString = createQueryString({
      limit: newLimit,
      page: '1'
    });
    router.push(`${pathname}?${queryString}`);
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '—';
    try {
      const birthDate = parseISO(dateOfBirth);
      const age = differenceInYears(new Date(), birthDate);
      return `${age} yrs`;
    } catch {
      return '—';
    }
  };


  // Format next session
  const formatNextSession = (nextSession?: { startTime: string; instructorName?: string } | null | undefined) => {
    if (!nextSession?.startTime) return '—';

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

  // Get lesson milestone emoji
  const getLessonMilestone = (count: number) => {
    if (count >= 50) return '🏆';
    if (count >= 25) return '⭐';
    if (count >= 10) return '🎯';
    if (count >= 5) return '✨';
    return '';
  };

  // Handle row click
  const handleRowClick = (swimmer: Swimmer) => {
    setSelectedSwimmer(swimmer);
    setIsModalOpen(true);
  };

  // Handle approve swimmer
  const handleApprove = async (swimmer: Swimmer) => {
    try {
      const response = await fetch(`/api/admin/swimmers/${swimmer.id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSwimmers(); // Refresh the list
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error approving swimmer:', error);
    }
  };

  // Handle decline swimmer
  const handleDecline = async (swimmer: Swimmer) => {
    try {
      const response = await fetch(`/api/admin/swimmers/${swimmer.id}/decline`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSwimmers(); // Refresh the list
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error declining swimmer:', error);
    }
  };

  // Render loading skeleton
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        {columns.map((column) => (
          <TableCell key={column.key}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Render error state
  if (error && swimmers.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <div className="text-destructive font-medium mb-2">Error loading swimmers</div>
        <div className="text-sm text-muted-foreground mb-4">{error}</div>
        <Button onClick={fetchSwimmers} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search swimmers, parents, or emails..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value || null)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={funding} onValueChange={(value) => updateFilter('funding', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Funding" />
              </SelectTrigger>
              <SelectContent>
                {fundingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={(value) => updateFilter('level', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={limit.toString()}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.width}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className={cn(
                      "flex items-center",
                      column.sortable && "cursor-pointer hover:text-foreground"
                    )}>
                      {column.label}
                      {column.sortable && sortBy === column.key && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : swimmers.length === 0 ? (
                <TableRow key="no-swimmers">
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No swimmers found matching your filters.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                swimmers.map((swimmer) => (
                  <TableRow
                    key={swimmer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(swimmer)}
                  >
                  {/* Swimmer */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {swimmer.photoUrl ? (
                        <img
                          src={swimmer.photoUrl}
                          alt={swimmer.firstName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-medium text-sm">
                          {getInitials(swimmer.firstName, swimmer.lastName)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{swimmer.firstName} {swimmer.lastName}</p>
                        <p className="text-xs text-muted-foreground">ID: {swimmer.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Age */}
                  <TableCell>
                    {calculateAge(swimmer.dateOfBirth)}
                  </TableCell>

                  {/* Parent */}
                  <TableCell>
                    {swimmer.parent ? (
                      <div>
                        <div className="font-medium">{swimmer.parent.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {swimmer.parent.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge
                        type="enrollment"
                        value={swimmer.enrollmentStatus}
                      />
                      {swimmer.approvalStatus === 'pending' && (
                        <StatusBadge
                          type="approval"
                          value="pending"
                          className="text-xs"
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Funding */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge
                        type="funding"
                        value={swimmer.paymentType}
                        showIcon={true}
                      />
                      {swimmer.hasFundingAuthorization && swimmer.vmrcCurrentPosNumber && (
                        <div className="text-xs text-violet-600 font-medium">
                          PO: {swimmer.vmrcCurrentPosNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Level */}
                  <TableCell>
                    {swimmer.currentLevel ? (
                      <div className="text-sm font-medium">
                        {swimmer.currentLevel.displayName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Lessons */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{swimmer.lessonsCompleted}</span>
                      {getLessonMilestone(swimmer.lessonsCompleted) && (
                        <span className="text-lg">
                          {getLessonMilestone(swimmer.lessonsCompleted)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Next Session */}
                  <TableCell>
                    <div className="text-sm">
                      {formatNextSession(swimmer.nextSession)}
                    </div>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} swimmers
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Swimmer Detail Modal */}
    <SwimmerDetailModal
      swimmer={selectedSwimmer}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onApprove={handleApprove}
      onDecline={handleDecline}
      onRefresh={fetchSwimmers}
    />
  </>
  );
}