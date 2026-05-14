'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, StatusDot } from './StatusBadge';
import { EmailComposerModal } from '@/components/email/EmailComposerModal';
import ProgressUpdateModal from '@/components/progress/ProgressUpdateModal';
import EditImportantNotesModal from '@/components/staff-mode/modals/EditImportantNotesModal';
import { EnhancedSkillChecklist } from '@/components/instructor/EnhancedSkillChecklist';
import { LevelSelector } from './LevelSelector';
import { StatusSelector } from './StatusSelector';
import { InternalNotesTab } from '@/components/admin/InternalNotesTab';
import { format, parseISO, differenceInDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar,
  Edit,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  DollarSign,
  Award as AwardIcon,
  HelpCircle,
  AlertCircle,
  Stethoscope,
  Heart,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  Award,
  Plus,
  Building2,
  ClipboardList,
  UserPlus,
  Loader2,
  Target,
  CircleDot,
  Circle,
  Lightbulb,
} from 'lucide-react';

import { useParentInvitation } from '@/hooks/useParentInvitation';
import { ParentInfoCard } from './ParentInfoCard';
import { CoordinatorInfoCard } from './CoordinatorInfoCard';
import { AssessmentReportTab } from './AssessmentReportTab';

// Types
export interface Swimmer {
  id: string;
  parentId: string;
  parentEmail?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  enrollmentStatus: string;
  enrollment_status?: string;
  approvalStatus?: string;
  approval_status?: string;
  assessmentStatus: string;
  currentLevelId?: string | null;
  currentLevel?: {
    id: string;
    name: string;
    displayName: string;
    color?: string;
  } | null;
  paymentType: string;
  hasFundingAuthorization: boolean;
  photoUrl?: string;
  fundedSessionsUsed?: number;
  fundedSessionsAuthorized?: number;
  currentPoNumber?: string;
  poExpiresAt?: string;
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
  swim_goals?: string[];
  assessment_status?: string;
  hasAllergies?: boolean;
  allergiesDescription?: string;
  hasMedicalConditions?: boolean;
  medicalConditionsDescription?: string;
  historyOfSeizures?: boolean;
  seizuresDescription?: string;
  toiletTrained?: string;
  nonAmbulatory?: boolean;
  communicationType?: string[];
  otherTherapies?: boolean;
  therapiesDescription?: string;
  selfInjuriousBehavior?: boolean;
  selfInjuriousBehaviorDescription?: string;
  aggressiveBehavior?: boolean;
  aggressiveBehaviorDescription?: string;
  elopementHistory?: boolean;
  elopementHistoryDescription?: string;
  hasBehaviorPlan?: boolean;
  restraintHistory?: boolean;
  restraintHistoryDescription?: string;
  previousSwimLessons?: boolean;
  comfortableInWater?: string;
  strengthsInterests?: string;
  flexibleSwimmer?: boolean;
  signedWaiver?: boolean;
  photoRelease?: boolean;
  isFundedClient?: boolean;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  admin_notes?: string;
  important_notes?: string[];
  invitedAt?: string;
  photo_video_signature?: string;
  cancellation_policy_signature?: string;
  liability_waiver_signature?: string;
}

interface SwimmerDetailModalProps {
  swimmer: Swimmer | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (swimmer: Swimmer) => void;
  onDecline?: (swimmer: Swimmer) => void;
}

export function SwimmerDetailModal({
  swimmer,
  isOpen,
  onClose,
  onApprove,
  onDecline,
}: SwimmerDetailModalProps) {
  const router = useRouter();
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === 'admin';
  const [progressNotes, setProgressNotes] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [swimmerSkills, setSwimmerSkills] = useState<any[]>([]);
  const [swimmerTargets, setSwimmerTargets] = useState<any[]>([]);
  const [swimmerStrategies, setSwimmerStrategies] = useState<any[]>([]);
  const [assessmentReport, setAssessmentReport] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [skillTrackerOpen, setSkillTrackerOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<{
    email: string;
    name: string;
    type: 'coordinator' | 'parent';
  } | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedBookingForProgress, setSelectedBookingForProgress] = useState<any>(null);
  const [showImportantNotesModal, setShowImportantNotesModal] = useState(false);
  // Local swimmer state to allow updates without prop changes
  const [localSwimmer, setLocalSwimmer] = useState<Swimmer | null>(swimmer);

  // Parent invitation hook
  const { inviteParent, isInviting } = useParentInvitation();

  // Sync localSwimmer when prop changes
  useEffect(() => {
    setLocalSwimmer(swimmer);
  }, [swimmer]);

  // Use localSwimmer if available, otherwise prop (should never be null after mount)
  const displaySwimmer = localSwimmer || swimmer;

  // Helper functions
  const canInviteParent = (
    isAdmin: boolean,
    swimmer: Swimmer | null
  ): boolean => {
    if (!isAdmin || !swimmer) return false;
    if (swimmer.parent?.id || swimmer.parentId) return false;
    if (!swimmer.parentEmail) return false;
    return true;
  };

  const getInviteButtonText = (
    isInviting: boolean,
    alreadyInvited: boolean
  ): string => {
    if (isInviting) return 'Sending...';
    if (alreadyInvited) return 'Resend Invite';
    return 'Invite Parent';
  };

  const hasCoordinator = (swimmer: Swimmer): boolean => {
    return !!(swimmer.coordinatorName || swimmer.coordinatorEmail || swimmer.coordinatorPhone);
  };

  const mapSwimmerResponse = (raw: any): Swimmer => {
    return {
      ...raw,
      invitedAt: raw.invited_at,
      parentId: raw.parent_id,
      parentEmail: raw.parent_email,
      firstName: raw.first_name,
      lastName: raw.last_name,
      fullName: raw.full_name || `${raw.first_name} ${raw.last_name}`,
      dateOfBirth: raw.date_of_birth,
      enrollmentStatus: raw.enrollment_status,
      approvalStatus: raw.approval_status,
      assessmentStatus: raw.assessment_status,
      currentLevelId: raw.current_level_id,
      paymentType: raw.payment_type,
      hasFundingAuthorization: raw.has_funding_authorization,
      photoUrl: raw.photo_url,
      fundedSessionsUsed: raw.funded_sessions_used,
      fundedSessionsAuthorized: raw.funded_sessions_authorized,
      currentPoNumber: raw.current_po_number,
      poExpiresAt: raw.po_expires_at,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      lessonsCompleted: raw.lessons_completed,
      coordinatorName: raw.coordinator_name,
      coordinatorEmail: raw.coordinator_email,
      coordinatorPhone: raw.coordinator_phone,
      parent: raw.parent ? {
        id: raw.parent.id,
        fullName: raw.parent.full_name,
        email: raw.parent.email,
        phone: raw.parent.phone,
      } : null,
    };
  };

  const fetchAdditionalData = useCallback(async () => {
    if (!swimmer?.id) return;
    setLoadingData(true);

    try {
      const supabase = createClient();

      // Fetch progress notes
      const { data: notes, error: notesError } = await supabase
        .from('progress_notes')
        .select(`
          id, created_at, lesson_summary, instructor_notes, skills_working_on, skills_mastered,
          instructor:profiles!instructor_id(full_name)
        `)
        .eq('swimmer_id', swimmer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notesError) {
        console.error('Error fetching progress notes:', notesError);
      }
      setProgressNotes(notes || []);

      // Fetch upcoming bookings - use a simpler approach
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id, status, session_id,
          sessions!inner(id, start_time, end_time, location, instructor_id)
        `)
        .eq('swimmer_id', swimmer.id)
        .eq('status', 'confirmed')
        .gte('sessions.start_time', new Date().toISOString())
        .limit(5);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Sort bookings by start_time manually since ordering through join is complex
      const sortedBookings = (bookings || []).sort((a, b) => {
        const timeA = a.sessions?.start_time ? new Date(a.sessions.start_time).getTime() : 0;
        const timeB = b.sessions?.start_time ? new Date(b.sessions.start_time).getTime() : 0;
        return timeA - timeB;
      });

      setUpcomingBookings(sortedBookings);

      // Fetch recent past bookings for progress updates
      const { data: pastBookings, error: pastBookingsError } = await supabase
        .from('bookings')
        .select(`
          id, status, session_id,
          sessions!inner(id, start_time, end_time, location, instructor_id)
        `)
        .eq('swimmer_id', swimmer.id)
        .eq('status', 'confirmed')
        .lt('sessions.start_time', new Date().toISOString())
        .limit(10);

      if (pastBookingsError) {
        console.error('Error fetching past bookings:', pastBookingsError);
      }
      // Sort bookings by start_time manually since ordering through join is complex
      const sortedPastBookings = (pastBookings || []).sort((a, b) => {
        const timeA = a.sessions?.start_time ? new Date(a.sessions.start_time).getTime() : 0;
        const timeB = b.sessions?.start_time ? new Date(b.sessions.start_time).getTime() : 0;
        return timeB - timeA; // descending (most recent first)
      });
      setRecentBookings(sortedPastBookings);

      // Fetch swimmer skills - check if table exists first
      try {
        const { data: skills, error: skillsError } = await supabase
          .from('swimmer_skills')
          .select(`
            id, status, instructor_notes, date_started, date_mastered, updated_at,
            skill:skills(id, name, description, sequence)
          `)
          .eq('swimmer_id', swimmer.id);

        if (skillsError) {
          console.error('Error fetching swimmer skills:', skillsError);
          // If table doesn't exist, use empty array
          setSwimmerSkills([]);
        } else {
          setSwimmerSkills(skills || []);
        }
      } catch (error) {
        console.error('Error in swimmer skills query:', error);
        setSwimmerSkills([]);
      }

      // Fetch swimmer targets
      try {
        const { data: targets, error: targetsError } = await supabase
          .from('swimmer_targets')
          .select('*')
          .eq('swimmer_id', swimmer.id)
          .order('created_at', { ascending: false });

        if (targetsError) {
          console.error('Error fetching swimmer targets:', targetsError);
          setSwimmerTargets([]);
        } else {
          setSwimmerTargets(targets || []);
        }
      } catch (error) {
        console.error('Error in swimmer targets query:', error);
        setSwimmerTargets([]);
      }

      // Fetch swimmer strategies
      try {
        const { data: strategies, error: strategiesError } = await supabase
          .from('swimmer_strategies')
          .select('*')
          .eq('swimmer_id', swimmer.id)
          .order('created_at', { ascending: false });

        if (strategiesError) {
          console.error('Error fetching swimmer strategies:', strategiesError);
          setSwimmerStrategies([]);
        } else {
          setSwimmerStrategies(strategies || []);
        }
      } catch (error) {
        console.error('Error in swimmer strategies query:', error);
        setSwimmerStrategies([]);
      }

      // Fetch assessment report if swimmer has completed assessment
      // Check both camelCase and snake_case versions, handle null/undefined, and use case-insensitive comparison
      const hasCompletedAssessment = !!(
        (swimmer.assessmentStatus && swimmer.assessmentStatus.toString().toLowerCase() === 'completed') ||
        (swimmer.assessment_status && swimmer.assessment_status.toString().toLowerCase() === 'completed')
      );

      console.log('Assessment tab debug:', {
        swimmerId: swimmer.id,
        assessmentStatus: swimmer.assessmentStatus,
        assessment_status: swimmer.assessment_status,
        hasCompletedAssessment
      });

      if (hasCompletedAssessment) {
        try {
          const { data: assessment, error: assessmentError } = await supabase
            .from('assessment_reports')
            .select('*')
            .eq('swimmer_id', swimmer.id)
            .order('assessment_date', { ascending: false })
            .limit(1)
            .single();

          console.log('Assessment fetch result:', {
            data: assessment,
            error: assessmentError,
            hasData: !!assessment,
            errorCode: assessmentError?.code
          });

          if (assessmentError && assessmentError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching assessment report:', assessmentError);
          } else {
            setAssessmentReport(assessment);
          }
        } catch (error) {
          console.error('Error fetching assessment report:', error);
        }
      } else {
        console.log('Skipping assessment fetch - swimmer does not have completed assessment status');
      }

    } catch (error) {
      console.error('Error in fetchAdditionalData:', error);
    } finally {
      setLoadingData(false);
    }
  }, [swimmer?.id]);

  // Fetch updated swimmer data (including invited_at)
  const fetchSwimmer = useCallback(async () => {
    if (!swimmer?.id) return;
    try {
      const apiEndpoint = role === 'admin'
        ? `/api/admin/swimmers/${swimmer.id}`
        : `/api/instructor/swimmers/${swimmer.id}`;
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch swimmer: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.swimmer) {
        const mapped = mapSwimmerResponse(data.swimmer);
        setLocalSwimmer(mapped);
      }
    } catch (error) {
      console.error('Error fetching updated swimmer:', error);
    }
  }, [swimmer?.id, role]);

  useEffect(() => {
    if (isOpen && swimmer?.id) {
      fetchAdditionalData();
    }
  }, [isOpen, swimmer?.id, fetchAdditionalData]);

  // Reset assessment report when swimmer changes or modal closes
  useEffect(() => {
    if (!isOpen || !swimmer?.id) {
      setAssessmentReport(null);
    }
  }, [isOpen, swimmer?.id]);

  if (!swimmer) return null;

  // Safely get payment type with fallback
  const paymentType = displaySwimmer.paymentType || 'private_pay';

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '—';
    try {
      const birthDate = parseISO(dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
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

  // Handle skill status updates
  const handleSkillUpdate = async (skillId: string, newStatus: 'not_started' | 'in_progress' | 'mastered', notes?: string) => {
    if (!swimmer?.id) return;

    const supabase = createClient();
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updates.instructor_notes = notes;
      }

      if (newStatus === 'mastered') {
        updates.date_mastered = new Date().toISOString();
      } else if (newStatus === 'in_progress') {
        updates.date_started = new Date().toISOString();
      }

      const { error } = await supabase
        .from('swimmer_skills')
        .update(updates)
        .eq('id', skillId)
        .eq('swimmer_id', swimmer.id);

      if (error) throw error;

      // Refresh skills data
      fetchAdditionalData();
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  };

  const handleEdit = () => {
    console.log('handleEdit clicked', { swimmerId: swimmer.id });
    onClose();
    const editPath = isAdmin ? `/admin/swimmers/${swimmer.id}/edit` : `/parent/swimmers/${swimmer.id}/edit`;
    router.push(editPath);
  };


  const handleViewFullPage = () => {
    onClose();
    const viewPath = isAdmin ? `/admin/swimmers/${swimmer.id}` : `/parent/swimmers/${swimmer.id}`;
    router.push(viewPath);
  };

  const handleInviteParent = async () => {
    if (!displaySwimmer?.id || !displaySwimmer.parentEmail) return;

    const result = await inviteParent(
      displaySwimmer.id,
      displaySwimmer.parentEmail,
      displaySwimmer.parent?.fullName
    );

    if (result.success) {
      toast({
        title: result.linked
          ? 'Parent account found and linked!'
          : result.isResend
            ? 'Invitation resent!'
            : 'Invitation sent!',
        description: result.message,
      });
      fetchSwimmer();
      fetchAdditionalData();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1200px] w-[95vw] max-h-[94vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                {swimmer.photoUrl && (
                  <AvatarImage src={swimmer.photoUrl} alt={swimmer.firstName} />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground text-base font-medium">
                  {getInitials(swimmer.firstName, swimmer.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-lg font-semibold">
                      {swimmer.firstName} {swimmer.lastName}
                    </DialogTitle>
                  </DialogHeader>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  {calculateAge(swimmer.dateOfBirth) !== '—' && (
                    <span>{calculateAge(swimmer.dateOfBirth)}</span>
                  )}
                  {swimmer.currentLevel && (
                    <>
                      <span className="stat-inline-divider" />
                      <span className="font-medium text-foreground">{swimmer.currentLevel.displayName}</span>
                    </>
                  )}
                  <span className="stat-inline-divider" />
                  <StatusDot type="enrollment" value={swimmer.enrollmentStatus} size="md" />
                  {swimmer.approvalStatus && swimmer.approvalStatus !== 'approved' && (
                    <>
                      <span className="stat-inline-divider" />
                      <StatusDot type="approval" value={swimmer.approvalStatus} size="md" />
                    </>
                  )}
                  <span className="stat-inline-divider" />
                  <StatusDot type="funding" value={paymentType} size="md" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={handleViewFullPage}>
                Full Page
              </Button>
              {isAdmin && swimmer.approvalStatus === 'pending' && onApprove && onDecline && (
                <>
                  <Button size="sm" className="h-8 text-sm bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(swimmer)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 text-sm" onClick={() => onDecline(swimmer)}>
                    <XCircle className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="px-4 py-3">
          {/* Mobile Dropdown */}
          <div className="block md:hidden mb-3">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger id="mobile-tab-select" name="mobileTabSelect" className="w-full h-9 text-sm">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
                {assessmentReport && <SelectItem value="assessment">Assessment</SelectItem>}
                {isAdmin && <SelectItem value="billing">Billing</SelectItem>}
                {isAdmin && <SelectItem value="notes">Notes</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs - Underline style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <TabsList className="h-auto p-0 bg-transparent border-b border-border/50 rounded-none w-full justify-start gap-0">
              <TabsTrigger value="overview" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Overview</TabsTrigger>
              <TabsTrigger value="medical" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Medical</TabsTrigger>
              <TabsTrigger value="progress" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Progress</TabsTrigger>
              <TabsTrigger value="sessions" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Sessions</TabsTrigger>
              {assessmentReport && (
                <TabsTrigger value="assessment" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Assessment</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="billing" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Billing</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="notes" className="px-4 py-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Notes</TabsTrigger>
              )}
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Content - Left 2 columns */}
              <div className="lg:col-span-2 space-y-3">
                
                {/* Status Management - Admin Only (compact) */}
                {isAdmin && swimmer && (
                  <div className="chart-section">
                    <h3 className="chart-header">Status Management</h3>
                    <StatusSelector
                      swimmerId={swimmer.id}
                      currentEnrollmentStatus={swimmer.enrollmentStatus || swimmer.enrollment_status || ''}
                      currentAssessmentStatus={swimmer.assessmentStatus || swimmer.assessment_status || ''}
                      currentApprovalStatus={swimmer.approvalStatus || swimmer.approval_status || null}
                      onStatusChange={() => fetchAdditionalData()}
                    />
                  </div>
                )}

                {/* Key Info */}
                <div className="chart-section">
                  <h3 className="chart-header">Key Information</h3>
                  <div className="chart-grid">
                    {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                      <div className="col-span-2 lg:col-span-3 mb-2">
                        <span className="chart-label">Diagnosis</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {swimmer.diagnosis.map((d, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {swimmer.height && (
                      <div className="chart-row-bordered">
                        <span className="chart-label">Height</span>
                        <span className="chart-value">{swimmer.height}</span>
                      </div>
                    )}
                    {swimmer.weight && (
                      <div className="chart-row-bordered">
                        <span className="chart-label">Weight</span>
                        <span className="chart-value">{swimmer.weight}</span>
                      </div>
                    )}
                    {swimmer.gender && (
                      <div className="chart-row-bordered">
                        <span className="chart-label">Gender</span>
                        <span className="chart-value capitalize">{swimmer.gender}</span>
                      </div>
                    )}
                    {calculateAge(swimmer.dateOfBirth) !== '—' && (
                      <div className="chart-row-bordered">
                        <span className="chart-label">Age</span>
                        <span className="chart-value">{calculateAge(swimmer.dateOfBirth)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Swimming Background */}
                <div className="chart-section">
                  <h3 className="chart-header">Swimming Background</h3>
                  <div className="chart-grid-2">
                    <div className="chart-row-bordered">
                      <span className="chart-label">Previous Lessons</span>
                      <span className="chart-value">{swimmer.previousSwimLessons ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Water Comfort</span>
                      <span className="chart-value capitalize">{swimmer.comfortableInWater || '—'}</span>
                    </div>
                  </div>
                  {/* Swim Goals */}
                  {((swimmer.swimGoals || swimmer.swim_goals)?.length > 0 || assessmentReport) && (
                    <div className="mt-3">
                      <span className="chart-label">Goals</span>
                      {assessmentReport ? (
                        <p className="text-sm mt-1 text-foreground">{assessmentReport.swim_skills_goals || assessmentReport.safety_goals || 'Set by instructor'}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(swimmer.swimGoals || swimmer.swim_goals || []).map((goal: string, i: number) => (
                            <span key={i} className="text-sm px-2 py-0.5 bg-muted rounded">{goal}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {swimmer.strengthsInterests && (
                    <div className="mt-3">
                      <span className="chart-label">Strengths/Interests</span>
                      <p className="text-sm mt-1">{swimmer.strengthsInterests}</p>
                    </div>
                  )}
                </div>

                {/* Care Needs */}
                {(swimmer.toiletTrained || swimmer.nonAmbulatory || swimmer.communicationType || swimmer.otherTherapies) && (
                  <div className="chart-section">
                    <h3 className="chart-header">Care Needs</h3>
                    <div className="chart-grid-2">
                      {swimmer.toiletTrained && (
                        <div className="chart-row-bordered">
                          <span className="chart-label">Toilet Trained</span>
                          <span className="chart-value capitalize">{swimmer.toiletTrained}</span>
                        </div>
                      )}
                      {swimmer.nonAmbulatory !== undefined && (
                        <div className="chart-row-bordered">
                          <span className="chart-label">Non-ambulatory</span>
                          <span className="chart-value">{swimmer.nonAmbulatory ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                    {swimmer.communicationType && swimmer.communicationType.length > 0 && (
                      <div className="mt-3">
                        <span className="chart-label">Communication</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {swimmer.communicationType.map((type, i) => (
                            <span key={i} className="text-sm px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{type}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {swimmer.otherTherapies && (
                      <div className="mt-3">
                        <span className="chart-label">Other Therapies</span>
                        <p className="text-sm mt-1">{swimmer.therapiesDescription || 'Yes'}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Parent Info - Compact Card */}
                <ParentInfoCard
                  swimmer={displaySwimmer}
                  isAdmin={isAdmin}
                  onInviteParent={handleInviteParent}
                  invitingParent={isInviting}
                />

                {/* Coordinator Info */}
                <CoordinatorInfoCard
                  swimmer={displaySwimmer}
                  onEmailCoordinator={() => {
                    if (displaySwimmer.coordinatorEmail) {
                      setEmailRecipient({
                        email: displaySwimmer.coordinatorEmail,
                        name: displaySwimmer.coordinatorName || 'Coordinator',
                        type: 'coordinator'
                      });
                      setEmailModalOpen(true);
                    }
                  }}
                />
              </div>

              {/* Right Column - Compact Stats & Actions */}
              <div className="space-y-3">
                {/* Quick Stats - Dense */}
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <h3 className="chart-header">Quick Stats</h3>
                  <div className="space-y-1">
                    <div className="chart-row-bordered">
                      <span className="chart-label">Assessment</span>
                      <StatusDot type="assessment" value={swimmer.assessmentStatus} size="sm" />
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Approval</span>
                      {swimmer.approvalStatus ? (
                        <StatusDot type="approval" value={swimmer.approvalStatus} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Flexible</span>
                      <span className="text-xs">{swimmer.flexibleSwimmer ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Lessons</span>
                      <span className="text-xs font-medium">{swimmer.lessonsCompleted || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Legal Documents - Compact */}
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <h3 className="chart-header">Legal Documents</h3>
                  <div className="space-y-1">
                    <div className="chart-row-bordered">
                      <span className="chart-label">Cancellation</span>
                      {swimmer.cancellation_policy_signature ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Liability</span>
                      {swimmer.liability_waiver_signature ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="chart-row-bordered">
                      <span className="chart-label">Photo Release</span>
                      {swimmer.photo_video_signature ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Compact buttons */}
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <h3 className="chart-header">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => router.push(isAdmin ? `/admin/bookings?swimmer=${swimmer.id}` : `/booking?swimmer=${swimmer.id}`)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs justify-start" onClick={handleEdit}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {(role === 'admin' || role === 'instructor') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs justify-start"
                        onClick={() => router.push(`/instructor/progress?swimmer=${swimmer.id}`)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Notes
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => {
                        const parentEmail = swimmer.parent?.email;
                        if (parentEmail) {
                          setEmailRecipient({ email: parentEmail, name: swimmer.parent?.fullName || 'Parent', type: 'parent' });
                          setEmailModalOpen(true);
                        } else {
                          toast({ title: 'No parent email', description: 'No parent email on file.', variant: 'destructive' });
                        }
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    {isAdmin && (
                      <Button
                        onClick={() => setShowImportantNotesModal(true)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs justify-start col-span-2 text-amber-700"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                        {displaySwimmer.important_notes?.length ? `Important (${displaySwimmer.important_notes.length})` : 'Add Important'}
                      </Button>
                    )}
                    {canInviteParent(isAdmin, displaySwimmer) && (
                      <Button variant="outline" size="sm" className="h-7 text-xs justify-start col-span-2" onClick={handleInviteParent} disabled={isInviting}>
                        {isInviting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />}
                        {getInviteButtonText(isInviting, !!displaySwimmer.invitedAt)}
                      </Button>
                    )}
                  </div>
                </div>

                {/* System Info - Minimal */}
                <div className="text-[10px] text-muted-foreground px-1">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{formatDate(swimmer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{formatDate(swimmer.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID</span>
                    <span className="font-mono">{swimmer.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Medical & Safety Tab */}
          <TabsContent value="medical" className="mt-4 space-y-4">
              {/* Medical Information */}
              <div className="chart-section">
                <h3 className="chart-header flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Medical Information
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {swimmer.hasAllergies !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.hasAllergies ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.hasAllergies ? 'text-red-700' : 'text-muted-foreground'}`}>Allergies</div>
                      <div className={`text-sm font-semibold ${swimmer.hasAllergies ? 'text-red-800' : ''}`}>{swimmer.hasAllergies ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.hasMedicalConditions !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.hasMedicalConditions ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.hasMedicalConditions ? 'text-red-700' : 'text-muted-foreground'}`}>Conditions</div>
                      <div className={`text-sm font-semibold ${swimmer.hasMedicalConditions ? 'text-red-800' : ''}`}>{swimmer.hasMedicalConditions ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.historyOfSeizures !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.historyOfSeizures ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.historyOfSeizures ? 'text-red-700' : 'text-muted-foreground'}`}>Seizures</div>
                      <div className={`text-sm font-semibold ${swimmer.historyOfSeizures ? 'text-red-800' : ''}`}>{swimmer.historyOfSeizures ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
                {/* Details for flagged items */}
                {(swimmer.hasAllergies && swimmer.allergiesDescription) || (swimmer.hasMedicalConditions && swimmer.medicalConditionsDescription) || (swimmer.historyOfSeizures && swimmer.seizuresDescription) ? (
                  <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded text-sm space-y-1.5">
                    {swimmer.hasAllergies && swimmer.allergiesDescription && (
                      <p><span className="font-medium text-red-700">Allergies:</span> <span className="text-red-600">{swimmer.allergiesDescription}</span></p>
                    )}
                    {swimmer.hasMedicalConditions && swimmer.medicalConditionsDescription && (
                      <p><span className="font-medium text-red-700">Conditions:</span> <span className="text-red-600">{swimmer.medicalConditionsDescription}</span></p>
                    )}
                    {swimmer.historyOfSeizures && swimmer.seizuresDescription && (
                      <p><span className="font-medium text-red-700">Seizures:</span> <span className="text-red-600">{swimmer.seizuresDescription}</span></p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Safety & Behavioral */}
              <div className="chart-section">
                <h3 className="chart-header flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Safety & Behavioral
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                  {swimmer.selfInjuriousBehavior !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.selfInjuriousBehavior ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.selfInjuriousBehavior ? 'text-red-700' : 'text-muted-foreground'}`}>Self-Inj</div>
                      <div className={`text-sm font-semibold ${swimmer.selfInjuriousBehavior ? 'text-red-800' : ''}`}>{swimmer.selfInjuriousBehavior ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.aggressiveBehavior !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.aggressiveBehavior ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.aggressiveBehavior ? 'text-red-700' : 'text-muted-foreground'}`}>Aggressive</div>
                      <div className={`text-sm font-semibold ${swimmer.aggressiveBehavior ? 'text-red-800' : ''}`}>{swimmer.aggressiveBehavior ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.elopementHistory !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.elopementHistory ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.elopementHistory ? 'text-red-700' : 'text-muted-foreground'}`}>Elopement</div>
                      <div className={`text-sm font-semibold ${swimmer.elopementHistory ? 'text-red-800' : ''}`}>{swimmer.elopementHistory ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.hasBehaviorPlan !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.hasBehaviorPlan ? 'bg-amber-50 border-amber-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.hasBehaviorPlan ? 'text-amber-700' : 'text-muted-foreground'}`}>Beh Plan</div>
                      <div className={`text-sm font-semibold ${swimmer.hasBehaviorPlan ? 'text-amber-800' : ''}`}>{swimmer.hasBehaviorPlan ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {swimmer.restraintHistory !== undefined && (
                    <div className={`p-3 rounded border text-center ${swimmer.restraintHistory ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border/30'}`}>
                      <div className={`text-xs uppercase tracking-wide ${swimmer.restraintHistory ? 'text-red-700' : 'text-muted-foreground'}`}>Restraint</div>
                      <div className={`text-sm font-semibold ${swimmer.restraintHistory ? 'text-red-800' : ''}`}>{swimmer.restraintHistory ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
                {/* Details for flagged behavioral items */}
                {(swimmer.selfInjuriousBehavior && swimmer.selfInjuriousBehaviorDescription) || (swimmer.aggressiveBehavior && swimmer.aggressiveBehaviorDescription) || (swimmer.elopementHistory && swimmer.elopementHistoryDescription) || (swimmer.restraintHistory && swimmer.restraintHistoryDescription) ? (
                  <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded text-sm space-y-1.5">
                    {swimmer.selfInjuriousBehavior && swimmer.selfInjuriousBehaviorDescription && (
                      <p><span className="font-medium text-red-700">Self-Injury:</span> <span className="text-red-600">{swimmer.selfInjuriousBehaviorDescription}</span></p>
                    )}
                    {swimmer.aggressiveBehavior && swimmer.aggressiveBehaviorDescription && (
                      <p><span className="font-medium text-red-700">Aggressive:</span> <span className="text-red-600">{swimmer.aggressiveBehaviorDescription}</span></p>
                    )}
                    {swimmer.elopementHistory && swimmer.elopementHistoryDescription && (
                      <p><span className="font-medium text-red-700">Elopement:</span> <span className="text-red-600">{swimmer.elopementHistoryDescription}</span></p>
                    )}
                    {swimmer.restraintHistory && swimmer.restraintHistoryDescription && (
                      <p><span className="font-medium text-red-700">Restraint:</span> <span className="text-red-600">{swimmer.restraintHistoryDescription}</span></p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 text-xs text-muted-foreground pt-3 border-t border-border/30">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" /> Flagged</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Has Plan</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted" /> Clear</span>
              </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <section>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <AwardIcon className="h-4 w-4" />
                Progress & Skills
              </h3>

              <div className="space-y-3">
                {/* Level Management - Admin Only */}
                {isAdmin && swimmer && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        Current Level
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Manually adjust swimmer's level (admin only)
                      </p>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <LevelSelector
                        swimmerId={swimmer.id}
                        currentLevelId={swimmer.currentLevelId || swimmer.currentLevel?.id || null}
                        onLevelChange={() => {
                          // Optionally refresh swimmer data
                          fetchAdditionalData();
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Level Progress Summary */}
                {swimmer.currentLevel && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        Level Progress
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {swimmer.currentLevel.displayName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      {loadingData ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-6 w-1/2" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: swimmer.currentLevel.color || '#ccc' }}
                              />
                              <span className="text-sm font-medium">{swimmer.currentLevel.displayName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(() => {
                                const mastered = swimmerSkills.filter(s => s.status === 'mastered').length;
                                const total = swimmerSkills.length;
                                return `${mastered}/${total} mastered`;
                              })()}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${swimmerSkills.length > 0 ?
                                  (swimmerSkills.filter(s => s.status === 'mastered').length / swimmerSkills.length) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Focus Today - In Progress Skills */}
                {swimmer.currentLevel && swimmerSkills.length > 0 && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        Focus Today
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {swimmerSkills.filter(s => s.status === 'in_progress').length} skills
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Skills currently in progress - focus on these during the lesson
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      {loadingData ? (
                        <div className="space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : swimmerSkills.filter(s => s.status === 'in_progress').length === 0 ? (
                        <div className="text-center py-4">
                          <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No skills in progress</p>
                          <p className="text-xs text-gray-500 mt-1">Mark skills as "In Progress" to see them here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {swimmerSkills
                            .filter(skill => skill.status === 'in_progress')
                            .map((skill) => (
                              <div key={skill.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CircleDot className="h-4 w-4 text-amber-500" />
                                      <span className="font-medium text-sm">{skill.skill?.name}</span>
                                    </div>
                                    {skill.instructor_notes ? (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-600 mb-1">Previous Notes:</p>
                                        <p className="text-xs text-gray-700 bg-white p-2 rounded border">{skill.instructor_notes}</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 mt-1">No notes yet</p>
                                    )}
                                    {skill.date_started && (
                                      <p className="text-xs text-gray-500 mt-2">
                                        Started: {new Date(skill.date_started).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      // Quick status update to mastered
                                      handleSkillUpdate(skill.id, 'mastered', skill.instructor_notes);
                                    }}
                                    disabled={!isAdmin && role !== 'instructor'}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Mastered Skills - Collapsible */}
                {swimmer.currentLevel && swimmerSkills.filter(s => s.status === 'mastered').length > 0 && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Mastered Skills
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          {swimmerSkills.filter(s => s.status === 'mastered').length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        {swimmerSkills
                          .filter(skill => skill.status === 'mastered')
                          .slice(0, 3) // Show first 3, rest in expandable
                          .map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-sm">{skill.skill?.name}</span>
                              </div>
                              {skill.date_mastered && (
                                <span className="text-xs text-gray-500">
                                  {new Date(skill.date_mastered).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ))}
                        {swimmerSkills.filter(s => s.status === 'mastered').length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs">
                            Show all {swimmerSkills.filter(s => s.status === 'mastered').length} mastered skills
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Not Started Skills - Collapsible */}
                {swimmer.currentLevel && swimmerSkills.filter(s => s.status === 'not_started').length > 0 && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Circle className="h-4 w-4 text-gray-400" />
                        Not Started
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                          {swimmerSkills.filter(s => s.status === 'not_started').length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        {swimmerSkills
                          .filter(skill => skill.status === 'not_started')
                          .slice(0, 3) // Show first 3
                          .map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Circle className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{skill.skill?.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  // Quick status update to in_progress
                                  handleSkillUpdate(skill.id, 'in_progress', '');
                                }}
                                disabled={!isAdmin && role !== 'instructor'}
                              >
                                Start
                              </Button>
                            </div>
                          ))}
                        {swimmerSkills.filter(s => s.status === 'not_started').length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs">
                            Show all {swimmerSkills.filter(s => s.status === 'not_started').length} not started skills
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Swimmer Targets */}
                {swimmerTargets.length > 0 && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Targets
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {swimmerTargets.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        {swimmerTargets.map((target) => (
                          <div key={target.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {target.status === 'in_progress' ? (
                                  <CircleDot className="h-3 w-3 text-yellow-500" />
                                ) : target.status === 'met' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400" />
                                )}
                                <span className="text-sm font-medium">{target.target_name}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`
                                  text-xs
                                  ${target.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    target.status === 'met' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'}
                                `}
                              >
                                {target.status === 'in_progress' ? 'In Progress' :
                                 target.status === 'met' ? 'Met' : 'Not Started'}
                              </Badge>
                            </div>
                            {target.notes && (
                              <p className="text-xs text-muted-foreground pl-5">{target.notes}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pl-5">
                              {target.date_started && (
                                <span>Started: {new Date(target.date_started).toLocaleDateString()}</span>
                              )}
                              {target.date_met && (
                                <span>Met: {new Date(target.date_met).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Swimmer Strategies */}
                {swimmerStrategies.length > 0 && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-purple-500" />
                        Strategies
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {swimmerStrategies.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        {swimmerStrategies.map((strategy) => (
                          <div key={strategy.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                            <div className="flex items-center gap-2">
                              {strategy.is_used ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Circle className="h-3 w-3 text-gray-400" />
                              )}
                              <span className="text-sm">{strategy.strategy_name}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`
                                text-xs
                                ${strategy.is_used ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                              `}
                            >
                              {strategy.is_used ? 'Used' : 'Not Used'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                {(isAdmin || role === 'instructor') && swimmer.currentLevel && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setSkillTrackerOpen(true)}
                        >
                          <ClipboardList className="h-3 w-3 mr-1" />
                          Full Skill Tracker
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Open progress note modal
                            setProgressModalOpen(true);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Add Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Progress Notes */}
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Recent Progress Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    {loadingData ? (
                      <div className="space-y-2">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : progressNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No progress notes yet</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {progressNotes.map((note) => (
                          <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{note.instructor?.full_name || 'Unknown Instructor'}</span>
                              <span className="text-muted-foreground">
                                {note.created_at ? format(new Date(note.created_at), 'MMM d, yyyy') : 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm mt-1 line-clamp-2">{note.lesson_summary || note.instructor_notes || 'No summary provided'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Progress Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2.5 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {swimmer.lessonsCompleted || 0}
                    </div>
                    <div className="text-xs text-blue-800">Lessons Completed</div>
                  </div>

                  {/* Next Session */}
                  <div className="bg-green-50 p-2.5 rounded-lg">
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
          </TabsContent>

          {/* Sessions & Bookings Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <section>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessions & Bookings
              </h3>

              <div className="space-y-4">
                {/* Upcoming Sessions */}
                <div className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Upcoming Sessions</h4>
                    <Link href={`/booking?swimmer=${swimmer.id}`}>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Book Session
                      </Button>
                    </Link>
                  </div>
                  {loadingData ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">
                              {booking.sessions?.start_time ? format(new Date(booking.sessions.start_time), 'EEE, MMM d @ h:mm a') : 'Time TBD'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.sessions?.location || 'TBD'}
                            </p>
                          </div>
                          <Badge variant="outline">{booking.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Session Statistics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold">{swimmer.fundedSessionsUsed || swimmer.lessonsCompleted || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{upcomingBookings.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{swimmer.fundedSessionsAuthorized || 0}</p>
                    <p className="text-xs text-muted-foreground">Authorized</p>
                  </div>
                </div>

                {/* Quick Progress Update Section - Admin only */}
                {isAdmin && swimmer && (
                  <Card className="mt-3">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Quick Progress Update</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Select a recent session to add progress notes
                      </p>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      {loadingData ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : recentBookings && recentBookings.length > 0 ? (
                        <div className="space-y-2">
                          {recentBookings.slice(0, 5).map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {booking.sessions?.start_time ? format(new Date(booking.sessions.start_time), 'MMM d, yyyy h:mm a') : 'Date TBD'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.sessions?.location || 'No location'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBookingForProgress(booking);
                                  setProgressModalOpen(true);
                                }}
                              >
                                Add Note
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent sessions found</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Billing & Funding Tab - Admin only */}
          {isAdmin && (
            <TabsContent value="billing" className="space-y-4">
              <section>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Billing & Funding
                </h3>

              {/* Payment Type */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Type</h4>
                <div className="flex items-center gap-2">
                  {paymentType === 'private_pay' && (
                    <DollarSign className="h-5 w-5 text-sky-600" />
                  )}
                  {paymentType === 'funded' && (
                    <Building2 className="h-5 w-5 text-violet-600" />
                  )}
                  {paymentType === 'scholarship' && (
                    <AwardIcon className="h-5 w-5 text-pink-600" />
                  )}
                  {paymentType === 'other' && (
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="font-medium capitalize">{paymentType.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Funding Source Details */}
              {paymentType === 'funded' && (
                <div className="space-y-3">
                  {/* PO Details */}
                  {swimmer.currentPoNumber && (
                    <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                      <h4 className="text-sm font-medium text-violet-800 mb-2">Current Purchase Order</h4>
                      <div className="text-lg font-bold text-violet-900">{swimmer.currentPoNumber}</div>
                      {swimmer.poExpiresAt && (
                        <div className="text-sm text-violet-600 mt-1">
                          Expires: {formatDate(swimmer.poExpiresAt)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sessions Progress */}
                  <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-violet-800">Sessions Usage</h4>
                      <div className="text-sm font-bold text-violet-900">
                        {swimmer.fundedSessionsUsed || 0} / {swimmer.fundedSessionsAuthorized || 0}
                      </div>
                    </div>
                    {swimmer.fundedSessionsAuthorized && swimmer.fundedSessionsUsed && (
                      <>
                        <div className="w-full bg-violet-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, ((swimmer.fundedSessionsUsed / swimmer.fundedSessionsAuthorized) * 100))}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-violet-600">
                          {swimmer.fundedSessionsAuthorized - swimmer.fundedSessionsUsed} sessions remaining
                        </div>
                      </>
                    )}
                  </div>

                  {/* Renewal Alert */}
                  {swimmer.fundedSessionsAuthorized &&
                   swimmer.fundedSessionsUsed &&
                   swimmer.fundedSessionsUsed >= swimmer.fundedSessionsAuthorized - 1 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          PO renewal needed soon
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Coordinator Info */}
                  {(swimmer.coordinatorName || swimmer.coordinatorEmail || swimmer.coordinatorPhone) && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Funding Coordinator</h4>
                      <div className="space-y-2">
                        {swimmer.coordinatorName && (
                          <div className="text-sm">{swimmer.coordinatorName}</div>
                        )}
                        {swimmer.coordinatorEmail && (
                          <div className="text-sm">
                            <a href={`mailto:${swimmer.coordinatorEmail}`} className="text-blue-600 hover:underline">
                              {swimmer.coordinatorEmail}
                            </a>
                          </div>
                        )}
                        {swimmer.coordinatorPhone && (
                          <div className="text-sm">
                            <a href={`tel:${swimmer.coordinatorPhone}`} className="text-blue-600 hover:underline">
                              {swimmer.coordinatorPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Private Pay Details */}
              {paymentType === 'private_pay' && (
                <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-sky-600" />
                    <div className="text-sm font-medium text-sky-800">Private Pay Client</div>
                  </div>
                  <p className="text-sm text-sky-700">
                    Standard rate applies. Payment required at time of booking.
                  </p>
                </div>
              )}

              {/* Scholarship Details */}
              {paymentType === 'scholarship' && (
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AwardIcon className="h-5 w-5 text-pink-600" />
                    <div className="text-sm font-medium text-pink-800">Scholarship Client</div>
                  </div>
                  <p className="text-sm text-pink-700">
                    Scholarship-funded lessons. No payment required from parent.
                  </p>
                </div>
              )}

              {/* Other Funding */}
              {paymentType === 'other' && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
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
          </TabsContent>
          )}

          {/* Internal Notes Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="notes" className="space-y-4">
              <InternalNotesTab swimmerId={swimmer.id} />
            </TabsContent>
          )}

          {/* Assessment Tab - Only shows if assessment exists */}
          {assessmentReport && (
            <TabsContent value="assessment" className="space-y-4">
              <section>
                <AssessmentReportTab assessment={assessmentReport} />
              </section>
            </TabsContent>
          )}
        </Tabs>
        </div>


        {/* Email Modal */}
        {emailRecipient && (
          <EmailComposerModal
            isOpen={emailModalOpen}
            onClose={() => {
              setEmailModalOpen(false);
              setEmailRecipient(null);
            }}
            recipientEmail={emailRecipient.email}
            recipientName={emailRecipient.name}
            recipientType={emailRecipient.type}
            swimmerName={`${swimmer.firstName} ${swimmer.lastName}`}
          />
        )}

        {/* Progress Update Modal */}
        {selectedBookingForProgress && swimmer && (
          <ProgressUpdateModal
            open={progressModalOpen}
            onOpenChange={setProgressModalOpen}
            bookingId={selectedBookingForProgress.id}
            sessionId={selectedBookingForProgress.session_id}
            swimmerId={swimmer.id}
            swimmerName={`${swimmer.firstName} ${swimmer.lastName}`}
            swimmerPhotoUrl={swimmer.photoUrl}
            sessionTime={selectedBookingForProgress.sessions?.start_time || ''}
            onSuccess={() => {
              setProgressModalOpen(false);
              setSelectedBookingForProgress(null);
              // Refresh progress notes
              fetchAdditionalData();
            }}
          />
        )}

        {/* Skill Tracker Modal */}
        <Dialog open={skillTrackerOpen} onOpenChange={setSkillTrackerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Skill Tracker - {swimmer?.firstName} {swimmer?.lastName}
              </DialogTitle>
            </DialogHeader>
            {swimmer && (
              <EnhancedSkillChecklist
                swimmerId={swimmer.id}
                readOnly={!isAdmin && role !== 'instructor'}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Important Notes Modal */}
        {displaySwimmer && (
          <EditImportantNotesModal
            open={showImportantNotesModal}
            onOpenChange={setShowImportantNotesModal}
            swimmerId={displaySwimmer.id}
            importantNotes={displaySwimmer.important_notes || []}
            onSuccess={() => {
              fetchAdditionalData();
            }}
          />
        )}

      </DialogContent>
    </Dialog>
  );
}
