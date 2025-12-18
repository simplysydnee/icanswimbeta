'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { differenceInYears, parseISO, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge, getStatusOptions } from './StatusBadge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Award,
  Calendar,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  BookOpen,
  X,
  AlertCircle,
  Stethoscope,
  Heart,
  ChevronsRight as ChevronsRightIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Edit as EditIcon,
  Building2,
  DollarSign,
  HelpCircle,
  Activity,
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
  { key: 'actions', label: 'Actions', sortable: false, width: 'w-[80px]' },
  { key: 'expand', label: '', sortable: false, width: 'w-[60px]' },
];

export function SwimmerManagementTable({ role }: SwimmerManagementTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed drawer state - now using full page navigation
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedMedicalSwimmerId, setExpandedMedicalSwimmerId] = useState<string | null>(null);

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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
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
    // Navigate to swimmer detail page instead of opening drawer
    if (role === 'instructor') {
      router.push(`/instructor/swimmers/${swimmer.id}`);
    } else {
      router.push(`/admin/swimmers/${swimmer.id}`);
    }
  };

  // Handle expand/collapse
  const handleExpandClick = (swimmerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedRowId === swimmerId) {
      // Collapsing the row, also collapse medical section if open
      setExpandedMedicalSwimmerId(null);
    }
    setExpandedRowId(expandedRowId === swimmerId ? null : swimmerId);
  };

  // Note: Approve/Decline functionality moved to swimmer detail page

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

  // Toggle medical section expansion
  const toggleMedicalExpansion = (swimmerId: string) => {
    setExpandedMedicalSwimmerId(
      expandedMedicalSwimmerId === swimmerId ? null : swimmerId
    );
  };

  // Render expanded row content
  const renderExpandedContent = (swimmer: Swimmer) => {
    const isExpanded = expandedRowId === swimmer.id;
    const isMedicalExpanded = expandedMedicalSwimmerId === swimmer.id;

    // Calculate progress percentage (mock data for now)
    const progressPercentage = swimmer.currentLevel ? 65 : 0;

    return (
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            key={`expanded-${swimmer.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-blue-50/50 dark:bg-blue-900/10"
          >
            <TableCell colSpan={columns.length} className="p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="p-6"
              >
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={swimmer.photoUrl} alt={swimmer.fullName} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {getInitials(swimmer.firstName, swimmer.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{swimmer.fullName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {calculateAge(swimmer.dateOfBirth) !== '—' && (
                          <span className="text-muted-foreground">
                            {calculateAge(swimmer.dateOfBirth)}
                          </span>
                        )}
                        {swimmer.currentLevel && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge
                              variant="outline"
                              className="text-sm font-medium"
                            >
                              {swimmer.currentLevel.displayName}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleExpandClick(swimmer.id, e)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Row */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <StatusBadge
                    type="enrollment"
                    value={swimmer.enrollmentStatus}
                  />

                  {swimmer.approvalStatus && (
                    <StatusBadge
                      type="approval"
                      value={swimmer.approvalStatus}
                    />
                  )}

                  {swimmer.assessmentStatus && swimmer.assessmentStatus !== 'completed' && (
                    <StatusBadge
                      type="assessment"
                      value={swimmer.assessmentStatus}
                    />
                  )}

                  <StatusBadge
                    type="funding"
                    value={swimmer.paymentType}
                    showIcon={true}
                    size="large"
                  />

                  {swimmer.lessonsCompleted > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {swimmer.lessonsCompleted} lessons
                    </Badge>
                  )}
                </div>

                {/* Contact Section */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Parent Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {swimmer.parent?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${swimmer.parent.phone}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {swimmer.parent.phone}
                        </a>
                      </div>
                    )}
                    {swimmer.parent?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${swimmer.parent.email}`}
                          className="hover:text-blue-600 hover:underline truncate"
                        >
                          {swimmer.parent.email}
                        </a>
                      </div>
                    )}
                    {(!swimmer.parent?.phone && !swimmer.parent?.email) && (
                      <p className="text-sm text-muted-foreground">
                        Contact information not available
                      </p>
                    )}
                  </div>
                </section>

                {/* Funding Details */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {swimmer.paymentType === 'private_pay' && (
                      <DollarSign className="h-5 w-5 text-sky-600" />
                    )}
                    {swimmer.paymentType === 'vmrc' && (
                      <Building2 className="h-5 w-5 text-violet-600" />
                    )}
                    {swimmer.paymentType === 'scholarship' && (
                      <AwardIcon className="h-5 w-5 text-pink-600" />
                    )}
                    {swimmer.paymentType === 'other' && (
                      <HelpCircle className="h-5 w-5 text-gray-600" />
                    )}
                    Funding Details
                  </h3>

                  {swimmer.paymentType === 'vmrc' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {swimmer.vmrcCurrentPosNumber && (
                          <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                            <div className="text-sm font-medium text-violet-800">Current PO</div>
                            <div className="text-lg font-bold text-violet-900">{swimmer.vmrcCurrentPosNumber}</div>
                            {swimmer.vmrcPosExpiresAt && (
                              <div className="text-xs text-violet-600 mt-1">
                                Expires: {formatDate(swimmer.vmrcPosExpiresAt)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                          <div className="text-sm font-medium text-violet-800">Sessions</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-lg font-bold text-violet-900">
                              {swimmer.vmrcSessionsUsed || 0}
                            </div>
                            <div className="text-violet-700">/</div>
                            <div className="text-lg font-bold text-violet-900">
                              {swimmer.vmrcSessionsAuthorized || 0}
                            </div>
                          </div>
                          <div className="text-xs text-violet-600 mt-1">
                            Used / Authorized
                          </div>
                          {swimmer.vmrcSessionsAuthorized && swimmer.vmrcSessionsUsed && (
                            <div className="mt-2">
                              <div className="w-full bg-violet-200 rounded-full h-2">
                                <div
                                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ((swimmer.vmrcSessionsUsed / swimmer.vmrcSessionsAuthorized) * 100))}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {swimmer.vmrcSessionsAuthorized &&
                       swimmer.vmrcSessionsUsed &&
                       swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized - 1 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">
                              PO renewal needed soon
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}

                  {swimmer.paymentType === 'private_pay' && (
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-sky-600" />
                        <div className="text-sm font-medium text-sky-800">Private Pay Client</div>
                      </div>
                      <p className="text-sm text-sky-700">
                        Standard rate applies. Payment required at time of booking.
                      </p>
                    </div>
                  )}

                  {swimmer.paymentType === 'scholarship' && (
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AwardIcon className="h-5 w-5 text-pink-600" />
                        <div className="text-sm font-medium text-pink-800">Scholarship Client</div>
                      </div>
                      <p className="text-sm text-pink-700">
                        Scholarship-funded lessons. No payment required from parent.
                      </p>
                    </div>
                  )}

                  {swimmer.paymentType === 'other' && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="h-5 w-5 text-gray-600" />
                        <div className="text-sm font-medium text-gray-800">Other Funding</div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Custom funding arrangement. Contact admin for details.
                      </p>
                    </div>
                  )}
                </section>

                {/* Swimmer Details */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Swimmer Details</h3>

                  {/* Diagnosis Tags */}
                  {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</h4>
                      <div className="flex flex-wrap gap-2">
                        {swimmer.diagnosis.map((diagnosis, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {diagnosis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Swim Goals */}
                  {swimmer.swimGoals && swimmer.swimGoals.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <TargetIcon className="h-4 w-4" />
                        Swim Goals
                      </h4>
                      <ul className="space-y-1">
                        {swimmer.swimGoals.map((goal, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <ChevronsRightIcon className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medical Alerts */}
                  {(swimmer.hasAllergies || swimmer.hasMedicalConditions) && (
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleMedicalExpansion(swimmer.id)}
                        className="w-full p-3 bg-red-50 flex items-center justify-between hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Medical Alerts</span>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 text-red-600 transition-transform ${isMedicalExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isMedicalExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {swimmer.hasAllergies && (
                                <div>
                                  <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4" />
                                    Allergies
                                  </h5>
                                  <p className="text-sm">
                                    {swimmer.allergiesDescription || 'Allergies reported'}
                                  </p>
                                </div>
                              )}

                              {swimmer.hasMedicalConditions && (
                                <div>
                                  <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    Medical Conditions
                                  </h5>
                                  <p className="text-sm">
                                    {swimmer.medicalConditionsDescription || 'Medical conditions reported'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </section>

                {/* Progress Section */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AwardIcon className="h-5 w-5" />
                    Progress
                  </h3>

                  <div className="space-y-4">
                    {/* Current Level Progress */}
                    {swimmer.currentLevel && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{swimmer.currentLevel.displayName}</span>
                          <span className="text-xs text-muted-foreground">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Skills mastered: 8/12
                        </p>
                      </div>
                    )}

                    {/* Lessons Completed */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {swimmer.lessonsCompleted || 0}
                        </div>
                        <div className="text-xs text-blue-800">Lessons Completed</div>
                      </div>

                      {/* Next Session */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        {formatNextSession(swimmer.nextSession) !== '—' ? (
                          <>
                            <div className="text-sm font-medium text-green-800">
                              {formatNextSession(swimmer.nextSession)}
                            </div>
                            <div className="text-xs text-green-600">Next Session</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-green-800">
                              No upcoming sessions
                            </div>
                            <div className="text-xs text-green-600">Schedule a session</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Action Buttons */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book a Session
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Award className="h-4 w-4 mr-2" />
                      View Full Progress
                    </Button>

                    <Button variant="outline" className="w-full">
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Info
                    </Button>
                  </div>
                </section>
              </motion.div>
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    );
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
                <React.Fragment key={swimmer.id}>
                  <TableRow
                    key={`row-${swimmer.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(swimmer)}
                  >
                  {/* Swimmer */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={swimmer.photoUrl} alt={swimmer.fullName} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
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

                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit Swimmer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (role === 'instructor') {
                            router.push(`/instructor/swimmers/${swimmer.id}/edit`);
                          } else {
                            router.push(`/admin/swimmers/${swimmer.id}/edit`);
                          }
                        }}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Common actions */}
                          <DropdownMenuItem onClick={() => handleRowClick(swimmer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                        {role === 'admin' ? (
                          <>
                            {swimmer.enrollmentStatus === 'pending' && (
                              <>
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Decline
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => router.push(`/admin/swimmers/${swimmer.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Swimmer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/swimmers/${swimmer.id}?tab=progress`)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/booking?swimmer=${swimmer.id}`)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Book Session
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => router.push(`/instructor/progress?swimmer=${swimmer.id}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Add Progress Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/instructor/swimmers/${swimmer.id}?tab=progress`)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Progress
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>

                  {/* Expand Icon */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleExpandClick(swimmer.id, e)}
                      className="h-8 w-8"
                    >
                      {expandedRowId === swimmer.id ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded Content */}
                {renderExpandedContent(swimmer)}
                </React.Fragment>
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
  );
}