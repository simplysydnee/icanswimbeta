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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { EmailComposerModal } from '@/components/email/EmailComposerModal';
import ProgressUpdateModal from '@/components/progress/ProgressUpdateModal';
import { SkillChecklist } from '@/components/instructor/SkillChecklist';
import { LevelSelector } from './LevelSelector';
import { format, parseISO } from 'date-fns';
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
} from 'lucide-react';

// Types
export interface Swimmer {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
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
  isFundedClient?: boolean;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  admin_notes?: string;
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
        .order('sessions.start_time', { ascending: false })
        .limit(10);

      if (pastBookingsError) {
        console.error('Error fetching past bookings:', pastBookingsError);
      }
      setRecentBookings(pastBookings || []);

      // Fetch swimmer skills - check if table exists first
      try {
        const { data: skills, error: skillsError } = await supabase
          .from('swimmer_skills')
          .select(`
            id, status,
            skill:skills(id, name, description)
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
                {isAdmin && <SelectItem value="billing">Billing & Funding</SelectItem>}
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
              {isAdmin && (
                <TabsTrigger value="billing" className="px-2 py-1.5 text-[11px] sm:text-xs">Billing & Funding</TabsTrigger>
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

                {/* Parent Info */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Parent/Guardian Information
                  </h3>
                  {swimmer.parent ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{swimmer.parent.fullName || 'Not provided'}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {swimmer.parent.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>{swimmer.parent.email}</span>
                              </div>
                            )}
                            {swimmer.parent.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span>{swimmer.parent.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No parent information available</p>
                  )}
                </div>

                {/* Medical & Safety Summary */}
                {(swimmer.hasAllergies || swimmer.hasMedicalConditions || swimmer.historyOfSeizures) && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Medical & Safety Alerts
                    </h3>
                    <div className="space-y-3">
                      {swimmer.hasAllergies && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Allergies</p>
                            {swimmer.allergiesDescription && (
                              <p className="text-sm text-muted-foreground">{swimmer.allergiesDescription}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.hasMedicalConditions && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">Medical Conditions</p>
                            {swimmer.medicalConditionsDescription && (
                              <p className="text-sm text-muted-foreground">{swimmer.medicalConditionsDescription}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {swimmer.historyOfSeizures && (
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                          <div>
                            <p className="font-medium">History of Seizures</p>
                            <p className="text-sm text-muted-foreground">Requires special attention during lessons</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Swimming Background */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Swimming Background & Goals
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

                    {swimmer.swimGoals && swimmer.swimGoals.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Swim Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.swimGoals.map((goal, index) => (
                            <Badge key={index} variant="secondary">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</p>
                        <div className="flex flex-wrap gap-2">
                          {swimmer.diagnosis.map((d, i) => (
                            <Badge key={i} variant="outline">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

                    {/* Email Coordinator - Funded clients only */}
                    {swimmer.paymentType !== 'private_pay' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('Email Coordinator clicked', { swimmerId: swimmer.id, paymentType: swimmer.paymentType });
                          const coordEmail = swimmer.coordinatorEmail;
                          const coordName = swimmer.coordinatorName || 'Coordinator';

                          if (coordEmail) {
                            setEmailRecipient({
                              email: coordEmail,
                              name: coordName,
                              type: 'coordinator'
                            });
                            setEmailModalOpen(true);
                          } else {
                            toast({
                              title: 'No coordinator email',
                              description: 'This swimmer does not have a coordinator email on file.',
                              variant: 'destructive'
                            });
                          }
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Email Coordinator
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

            {/* Level Management - Admin only */}
            {isAdmin && swimmer && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    Level Management
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Manually adjust swimmer's level (admin only)
                  </p>
                </CardHeader>
                <CardContent>
                  <LevelSelector
                    swimmerId={swimmer.id}
                    currentLevelId={swimmer.currentLevel?.id || null}
                    onLevelChange={() => {
                      // Optionally refresh swimmer data
                      fetchAdditionalData();
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Admin Internal Notes - Admin only */}
            {isAdmin && swimmer && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Internal Notes (Staff Only)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    General notes about this swimmer - not visible to parents
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes (e.g., parent communications, scheduling issues, special considerations...)"
                    className="min-h-[100px] text-sm"
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSaveAdminNotes}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Medical & Safety Tab */}
          <TabsContent value="medical" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical & Safety Information
              </h3>

              {/* Medical Alerts */}
              {(swimmer.hasAllergies || swimmer.hasMedicalConditions) && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="w-full p-3 bg-red-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Medical Alerts</span>
                    </div>
                  </div>
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
                </div>
              )}

              {/* Safety Information */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seizures */}
                  {swimmer.historyOfSeizures !== undefined && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-amber-800">History of Seizures</div>
                        <Badge variant={swimmer.historyOfSeizures ? "destructive" : "outline"}>
                          {swimmer.historyOfSeizures ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Toilet Trained */}
                  {swimmer.toiletTrained !== undefined && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-blue-800">Toilet Trained</div>
                        <Badge variant={swimmer.toiletTrained ? "default" : "outline"}>
                          {swimmer.toiletTrained ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Non-Ambulatory */}
                  {swimmer.nonAmbulatory !== undefined && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-purple-800">Non-Ambulatory</div>
                        <Badge variant={swimmer.nonAmbulatory ? "destructive" : "outline"}>
                          {swimmer.nonAmbulatory ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Behavioral Information */}
              {(swimmer.aggressiveBehavior || swimmer.elopementHistory || swimmer.selfInjuriousBehavior) && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Behavioral Information
                  </h4>

                  <div className="space-y-3">
                    {/* Aggressive Behavior */}
                    {swimmer.aggressiveBehavior && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-red-800">Aggressive Behavior</div>
                          <Badge variant="destructive">Yes</Badge>
                        </div>
                        {swimmer.aggressiveBehaviorDescription && (
                          <p className="text-sm text-red-700">{swimmer.aggressiveBehaviorDescription}</p>
                        )}
                      </div>
                    )}

                    {/* Elopement History */}
                    {swimmer.elopementHistory && (
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-orange-800">Elopement History</div>
                          <Badge variant="destructive">Yes</Badge>
                        </div>
                        {swimmer.elopementDescription && (
                          <p className="text-sm text-orange-700">{swimmer.elopementDescription}</p>
                        )}
                      </div>
                    )}

                    {/* Self-Injurious Behavior */}
                    {swimmer.selfInjuriousBehavior && (
                      <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-pink-800">Self-Injurious Behavior</div>
                          <Badge variant="destructive">Yes</Badge>
                        </div>
                        {swimmer.selfInjuriousDescription && (
                          <p className="text-sm text-pink-700">{swimmer.selfInjuriousDescription}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                {/* Current Level Progress */}
                {swimmer.currentLevel && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Current Level: {swimmer.currentLevel.displayName}</h4>
                    {/* Skills Checklist */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Skills Progress</h4>
                      {loadingData ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : swimmerSkills.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No skills tracked yet</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {swimmerSkills.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{s.skill?.name}</span>
                              <Badge className={
                                s.status === 'mastered' ? 'bg-green-100 text-green-800' :
                                s.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {s.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Progress Notes */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Recent Progress Notes</h4>
                  {loadingData ? (
                    <div className="space-y-2">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : progressNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No progress notes yet</p>
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
                </div>

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

                {/* Skill Tracker Button */}
                {(isAdmin || role === 'instructor') && (
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setSkillTrackerOpen(true)}
                      className="w-full"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Open Skill Tracker
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      View and update all skills by level
                    </p>
                  </div>
                )}
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
              <SkillChecklist
                swimmerId={swimmer.id}
                readOnly={!isAdmin && role !== 'instructor'}
              />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}