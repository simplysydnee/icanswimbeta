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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { EmailComposerModal } from '@/components/email/EmailComposerModal';
import ProgressUpdateModal from '@/components/progress/ProgressUpdateModal';
import EditImportantNotesModal from '@/components/staff-mode/modals/EditImportantNotesModal';
import { EnhancedSkillChecklist } from '@/components/instructor/EnhancedSkillChecklist';
import { LevelSelector } from './LevelSelector';
import { StatusSelector } from './StatusSelector';
import { AssessmentReportTab } from './AssessmentReportTab';
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
  Building2,
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
  MessageSquare,
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
  const [adminNotes, setAdminNotes] = useState(swimmer?.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedBookingForProgress, setSelectedBookingForProgress] = useState<any>(null);
  const [showImportantNotesModal, setShowImportantNotesModal] = useState(false);

  // Parent invitation hook
  const { inviteParent, isInviting } = useParentInvitation();

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

  useEffect(() => {
    if (isOpen && swimmer?.id) {
      fetchAdditionalData();
    }
  }, [isOpen, swimmer?.id, fetchAdditionalData]);

  // Update admin notes when swimmer changes
  useEffect(() => {
    setAdminNotes(swimmer?.admin_notes || '');
  }, [swimmer?.admin_notes]);

  // Reset assessment report when swimmer changes or modal closes
  useEffect(() => {
    if (!isOpen || !swimmer?.id) {
      setAssessmentReport(null);
    }
  }, [isOpen, swimmer?.id]);

  if (!swimmer) return null;

  // Safely get payment type with fallback
  const paymentType = swimmer.paymentType || 'private_pay';

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

  const handleSaveAdminNotes = async () => {
    if (!swimmer?.id) return;

    setIsSavingNotes(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('swimmers')
        .update({ admin_notes: adminNotes })
        .eq('id', swimmer.id);

      if (error) throw error;
      toast({ title: 'Internal notes saved' });
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleInviteParent = async () => {
    if (!swimmer?.id || !swimmer.parentEmail) return;

    const result = await inviteParent(
      swimmer.id,
      swimmer.parentEmail,
      swimmer.parent?.fullName
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
      fetchAdditionalData();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar - photo or initials */}
              <Avatar className="h-16 w-16 border-2 border-cyan-200">
                {swimmer.photoUrl && (
                  <AvatarImage src={swimmer.photoUrl} alt={swimmer.firstName} />
                )}
                <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xl font-semibold">
                  {getInitials(swimmer.firstName, swimmer.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* Name, age, and edit icon */}
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl font-bold">
                    {swimmer.firstName} {swimmer.lastName}
                  </DialogTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit swimmer</span>
                  </Button>
                </div>
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

            {/* Action buttons - ROLE AWARE */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleViewFullPage}>View Full Page</Button>

              {/* Only admins see Approve/Decline */}
              {isAdmin && swimmer.approvalStatus === 'pending' && onApprove && onDecline && (
                <>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(swimmer)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => onDecline(swimmer)}>
                    <XCircle className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>
          </div>

        </DialogHeader>

        {/* Tabbed Interface */}
        <div className="mt-4">
          {/* Mobile Dropdown (visible on small and medium screens) */}
          <div className="block md:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger id="mobile-tab-select" name="mobileTabSelect" className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="medical">Medical & Safety</SelectItem>
                <SelectItem value="progress">Progress & Skills</SelectItem>
                <SelectItem value="sessions">Sessions & Bookings</SelectItem>
                {assessmentReport && <SelectItem value="assessment">Assessment</SelectItem>}
                {isAdmin && <SelectItem value="billing">Billing & Funding</SelectItem>}
                {isAdmin && <SelectItem value="notes">Internal Notes</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs (hidden on mobile, shown on medium and up) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <TabsList className="flex flex-wrap gap-1 mb-6">
              <TabsTrigger value="overview" className="px-2 py-1.5 text-[11px] sm:text-xs">Overview</TabsTrigger>
              <TabsTrigger value="medical" className="px-2 py-1.5 text-[11px] sm:text-xs">Medical & Safety</TabsTrigger>
              <TabsTrigger value="progress" className="px-2 py-1.5 text-[11px] sm:text-xs">Progress & Skills</TabsTrigger>
              <TabsTrigger value="sessions" className="px-2 py-1.5 text-[11px] sm:text-xs">Sessions & Bookings</TabsTrigger>
              {assessmentReport && (
                <TabsTrigger value="assessment" className="px-2 py-1.5 text-[11px] sm:text-xs">Assessment</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="billing" className="px-2 py-1.5 text-[11px] sm:text-xs">Billing & Funding</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="notes" className="px-2 py-1.5 text-[11px] sm:text-xs">Internal Notes</TabsTrigger>
              )}
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="md:col-span-3 space-y-6">
                {/* Status Row */}
                <div className="flex flex-wrap gap-2">
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
                    value={paymentType}
                    showIcon={true}
                    size="large"
                  />
                  {swimmer.lessonsCompleted > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {swimmer.lessonsCompleted} lessons
                    </Badge>
                  )}
                </div>

                {/* Status Management - Admin Only */}
                {isAdmin && swimmer && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Status Management
                    </h3>
                    <StatusSelector
                      swimmerId={swimmer.id}
                      currentEnrollmentStatus={swimmer.enrollmentStatus || swimmer.enrollment_status || ''}
                      currentAssessmentStatus={swimmer.assessmentStatus || swimmer.assessment_status || ''}
                      currentApprovalStatus={swimmer.approvalStatus || swimmer.approval_status || null}
                      onStatusChange={() => {
                        // Refresh swimmer data
                        fetchAdditionalData();
                      }}
                    />
                  </div>
                )}

                {/* Parent Info */}
                <ParentInfoCard
                  swimmer={swimmer}
                  isAdmin={isAdmin}
                  onInviteParent={handleInviteParent}
                  invitingParent={isInviting}
                />

                {/* Key Info Section */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Key Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Diagnosis */}
                    {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.diagnosis.map((d, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Height */}
                    {swimmer.height && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Height</p>
                        <p className="font-medium">{swimmer.height}</p>
                      </div>
                    )}

                    {/* Weight */}
                    {swimmer.weight && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Weight</p>
                        <p className="font-medium">{swimmer.weight}</p>
                      </div>
                    )}

                    {/* Age */}
                    {calculateAge(swimmer.dateOfBirth) !== '—' && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p className="font-medium">{calculateAge(swimmer.dateOfBirth)}</p>
                      </div>
                    )}

                    {/* Gender */}
                    {swimmer.gender && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{swimmer.gender}</p>
                      </div>
                    )}
                  </div>
                </div>


                {/* Swimming Background */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Swimming Background
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Previous Lessons</p>
                        <p className="font-medium">
                          {swimmer.previousSwimLessons ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Comfort in Water</p>
                        <p className="font-medium capitalize">{swimmer.comfortableInWater || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Swim Goals - Show instructor goals from assessment if available */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Swim Goals</p>
                      {assessmentReport ? (
                        <div className="space-y-2">
                          {assessmentReport.swim_skills_goals && (
                            <p className="text-sm"><span className="font-medium">Skills:</span> {assessmentReport.swim_skills_goals}</p>
                          )}
                          {assessmentReport.safety_goals && (
                            <p className="text-sm"><span className="font-medium">Safety:</span> {assessmentReport.safety_goals}</p>
                          )}
                        </div>
                      ) : (
                        ((swimmer.swimGoals || swimmer.swim_goals)?.length || 0) > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(swimmer.swimGoals || swimmer.swim_goals || []).map((goal: string, i: number) => (
                              <Badge key={i} variant="secondary">{goal}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No goals set</p>
                        )
                      )}
                    </div>

                    {swimmer.strengthsInterests && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Strengths & Interests</p>
                        <p className="font-medium">{swimmer.strengthsInterests}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Care Needs Section */}
                {(swimmer.toiletTrained || swimmer.nonAmbulatory || swimmer.communicationType || swimmer.otherTherapies) && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Care Needs
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Toilet Trained */}
                        {swimmer.toiletTrained && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Toilet Trained</p>
                            <p className="font-medium capitalize">{swimmer.toiletTrained}</p>
                          </div>
                        )}

                        {/* Non-ambulatory */}
                        {swimmer.nonAmbulatory !== undefined && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Non-ambulatory</p>
                            <p className="font-medium">{swimmer.nonAmbulatory ? 'Yes' : 'No'}</p>
                          </div>
                        )}
                      </div>

                      {/* Communication Type */}
                      {swimmer.communicationType && swimmer.communicationType.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Communication Type</p>
                          <div className="flex flex-wrap gap-2">
                            {swimmer.communicationType.map((type, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Therapies */}
                      {swimmer.otherTherapies && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Other Therapies</p>
                          <p className="font-medium">{swimmer.therapiesDescription || 'Receives other therapies'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <CoordinatorInfoCard
                  swimmer={swimmer}
                  onEmailCoordinator={() => {
                    if (swimmer.coordinatorEmail) {
                      setEmailRecipient({
                        email: swimmer.coordinatorEmail,
                        name: swimmer.coordinatorName || 'Coordinator',
                        type: 'coordinator'
                      });
                      setEmailModalOpen(true);
                    }
                  }}
                />
              </div>

              {/* Right Column - Stats & Actions */}
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Stats */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 whitespace-nowrap">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Assessment Status</p>
                      <div className="mt-1">
                        <StatusBadge
                          type="assessment"
                          value={swimmer.assessmentStatus}
                          size="small"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Approval Status</p>
                      <div className="mt-1">
                        {swimmer.approvalStatus ? (
                          <StatusBadge
                            type="approval"
                            value={swimmer.approvalStatus}
                            size="small"
                          />
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 mt-1">
                            Not Set
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Flexible Swimmer</p>
                      <Badge variant="outline" className="whitespace-normal text-left mt-1">
                        {swimmer.flexibleSwimmer ? 'Yes - Can fill last-minute spots' : 'No - Regular schedule only'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Legal Documents</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Waiver Signed</span>
                          {swimmer.signedWaiver ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Photo Release</span>
                          {swimmer.photoRelease ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {/* Book Session */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        console.log('Book Session clicked', { swimmerId: swimmer.id, isAdmin });
                        router.push(
                          isAdmin
                            ? `/admin/bookings?swimmer=${swimmer.id}`
                            : `/booking?swimmer=${swimmer.id}`
                        );
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>

                    {/* Edit Information */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleEdit}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Information
                    </Button>

                    {/* Add Progress Note - Admin/Instructor only */}
                    {(role === 'admin' || role === 'instructor') && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('Add Progress Note clicked', { swimmerId: swimmer.id, role });
                          router.push(`/instructor/progress?swimmer=${swimmer.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Progress Note
                      </Button>
                    )}

                    {/* Email Parent */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        console.log('Email Parent clicked', { swimmerId: swimmer.id });
                        const parentEmail = swimmer.parent?.email;
                        const parentName = swimmer.parent?.fullName || 'Parent';

                        if (parentEmail) {
                          setEmailRecipient({
                            email: parentEmail,
                            name: parentName,
                            type: 'parent'
                          });
                          setEmailModalOpen(true);
                        } else {
                          toast({
                            title: 'No parent email',
                            description: 'This swimmer does not have a parent email on file.',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Parent
                    </Button>

                    {/* Email Coordinator - Only VMRC/CVRC (have coordinators) */}
                    {swimmer.coordinatorEmail && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setEmailRecipient({
                            email: swimmer.coordinatorEmail!,
                            name: swimmer.coordinatorName || 'Coordinator',
                            type: 'coordinator'
                          });
                          setEmailModalOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Email Coordinator
                      </Button>
                    )}

                    {/* Add/Edit Important Notes - Admin only */}
                    {isAdmin && (
                      <Button
                        onClick={() => setShowImportantNotesModal(true)}
                        variant="outline"
                        className="w-full justify-start text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        {swimmer.important_notes && swimmer.important_notes.length > 0
                          ? `Edit Important Notes (${swimmer.important_notes.length})`
                          : 'Add Important Notes'}
                      </Button>
                    )}

                    {/* Invite Parent - Admin only, when no parent linked */}
                    {canInviteParent(isAdmin, swimmer) && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleInviteParent}
                        disabled={isInviting}
                      >
                        {isInviting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : swimmer.invitedAt ? (
                          <Mail className="h-4 w-4 mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {getInviteButtonText(isInviting, !!swimmer.invitedAt)}
                      </Button>
                    )}
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(swimmer.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{formatDate(swimmer.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Swimmer ID</span>
                      <span className="font-mono text-xs">{swimmer.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </TabsContent>

          {/* Medical & Safety Tab - Compact Grid Design */}
          <TabsContent value="medical" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical & Safety Information
              </h3>

              {/* Medical Information Grid */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-5 w-5 text-red-600" />
                  <h4 className="text-md font-semibold text-gray-800">Medical Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Allergies */}
                  {swimmer.hasAllergies !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.hasAllergies ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.hasAllergies ? 'text-red-800' : 'text-gray-700'}`}>Allergies</div>
                        <Badge
                          variant={swimmer.hasAllergies ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.hasAllergies ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.hasAllergies ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.hasAllergies && swimmer.allergiesDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.allergiesDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medical Conditions */}
                  {swimmer.hasMedicalConditions !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.hasMedicalConditions ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.hasMedicalConditions ? 'text-red-800' : 'text-gray-700'}`}>Conditions</div>
                        <Badge
                          variant={swimmer.hasMedicalConditions ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.hasMedicalConditions ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.hasMedicalConditions ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.hasMedicalConditions && swimmer.medicalConditionsDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.medicalConditionsDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* History of Seizures */}
                  {swimmer.historyOfSeizures !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.historyOfSeizures ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.historyOfSeizures ? 'text-red-800' : 'text-gray-700'}`}>Seizures</div>
                        <Badge
                          variant={swimmer.historyOfSeizures ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.historyOfSeizures ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.historyOfSeizures ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.historyOfSeizures && swimmer.seizuresDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.seizuresDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Safety & Behavioral Grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="text-md font-semibold text-gray-800">Safety & Behavioral</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Self Injurious Behavior */}
                  {swimmer.selfInjuriousBehavior !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.selfInjuriousBehavior ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.selfInjuriousBehavior ? 'text-red-800' : 'text-gray-700'}`}>Self-Inj.</div>
                        <Badge
                          variant={swimmer.selfInjuriousBehavior ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.selfInjuriousBehavior ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.selfInjuriousBehavior ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.selfInjuriousBehavior && swimmer.selfInjuriousBehaviorDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.selfInjuriousBehaviorDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aggressive Behavior */}
                  {swimmer.aggressiveBehavior !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.aggressiveBehavior ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.aggressiveBehavior ? 'text-red-800' : 'text-gray-700'}`}>Aggressive</div>
                        <Badge
                          variant={swimmer.aggressiveBehavior ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.aggressiveBehavior ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.aggressiveBehavior ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.aggressiveBehavior && swimmer.aggressiveBehaviorDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.aggressiveBehaviorDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Elopement History */}
                  {swimmer.elopementHistory !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.elopementHistory ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.elopementHistory ? 'text-red-800' : 'text-gray-700'}`}>Elopement</div>
                        <Badge
                          variant={swimmer.elopementHistory ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.elopementHistory ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.elopementHistory ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.elopementHistory && swimmer.elopementHistoryDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.elopementHistoryDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Has Behavior Plan */}
                  {swimmer.hasBehaviorPlan !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.hasBehaviorPlan ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.hasBehaviorPlan ? 'text-amber-800' : 'text-gray-700'}`}>Beh. Plan</div>
                        <Badge
                          variant="outline"
                          className={`text-xs h-5 px-1.5 ${swimmer.hasBehaviorPlan ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.hasBehaviorPlan ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Restraint History */}
                  {swimmer.restraintHistory !== undefined && (
                    <div className={`p-3 rounded-lg border ${swimmer.restraintHistory ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${swimmer.restraintHistory ? 'text-red-800' : 'text-gray-700'}`}>Restraint</div>
                        <Badge
                          variant={swimmer.restraintHistory ? "destructive" : "outline"}
                          className={`text-xs h-5 px-1.5 ${swimmer.restraintHistory ? '' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                        >
                          {swimmer.restraintHistory ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {swimmer.restraintHistory && swimmer.restraintHistoryDescription && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-medium text-red-800 mb-0.5">Details</p>
                          <p className="text-xs text-red-700 line-clamp-2">{swimmer.restraintHistoryDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Legend/Key */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-100 border border-red-300"></div>
                    <span>Red = "Yes" (requires attention)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-gray-100 border border-gray-300"></div>
                    <span>Gray = "No" (no issues)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-amber-100 border border-amber-300"></div>
                    <span>Amber = Behavior Plan exists</span>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AwardIcon className="h-5 w-5" />
                Progress & Skills
              </h3>

              <div className="space-y-6">
                {/* Level Management - Admin Only */}
                {isAdmin && swimmer && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        Current Level
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Manually adjust swimmer's level (admin only)
                      </p>
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        Level Progress
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {swimmer.currentLevel.displayName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-6 w-1/2" />
                        </div>
                      ) : (
                        <div className="space-y-3">
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
                    <CardHeader className="pb-2">
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
                    <CardContent>
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Mastered Skills
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          {swimmerSkills.filter(s => s.status === 'mastered').length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Circle className="h-4 w-4 text-gray-400" />
                        Not Started
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                          {swimmerSkills.filter(s => s.status === 'not_started').length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Targets
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {swimmerTargets.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-purple-500" />
                        Strategies
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {swimmerStrategies.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Recent Progress Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </TabsContent>

          {/* Sessions & Bookings Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sessions & Bookings
              </h3>

              <div className="space-y-6">
                {/* Upcoming Sessions */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{swimmer.fundedSessionsUsed || swimmer.lessonsCompleted || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{swimmer.fundedSessionsAuthorized || 0}</p>
                    <p className="text-xs text-muted-foreground">Authorized</p>
                  </div>
                </div>

                {/* Quick Progress Update Section - Admin only */}
                {isAdmin && swimmer && (
                  <Card className="mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Progress Update</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Select a recent session to add progress notes
                      </p>
                    </CardHeader>
                    <CardContent>
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
            <TabsContent value="billing" className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing & Funding
                </h3>

              {/* Payment Type */}
              <div className="mb-6">
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
                <div className="space-y-4">
                  {/* PO Details */}
                  {swimmer.currentPoNumber && (
                    <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
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
                  <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
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
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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

              {/* Scholarship Details */}
              {paymentType === 'scholarship' && (
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

              {/* Other Funding */}
              {paymentType === 'other' && (
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
          </TabsContent>
          )}

          {/* Internal Notes Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="notes" className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Internal Notes
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Staff-only notes about this swimmer (not visible to parents)
                </p>

                <div className="space-y-4">
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes (e.g., parent communications, scheduling issues, special considerations, behavior observations...)"
                    className="min-h-[200px]"
                  />

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {adminNotes?.length || 0} characters
                    </p>
                    <Button
                      onClick={handleSaveAdminNotes}
                      disabled={isSavingNotes}
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              </section>
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
        {swimmer && (
          <EditImportantNotesModal
            open={showImportantNotesModal}
            onOpenChange={setShowImportantNotesModal}
            swimmerId={swimmer.id}
            importantNotes={swimmer.important_notes || []}
            onSuccess={() => {
              fetchAdditionalData();
            }}
          />
        )}

      </DialogContent>
    </Dialog>
  );
}