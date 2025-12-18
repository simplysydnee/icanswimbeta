'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import {
  Calendar,
  Edit,
  CheckCircle,
  XCircle,
  Award,
  User,
  Mail,
  Phone,
  DollarSign,
  Building2,
  Award as AwardIcon,
  HelpCircle,
  AlertCircle,
  Stethoscope,
  Heart,
  Target as TargetIcon,
  ChevronsRight as ChevronsRightIcon,
  X,
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

interface SwimmerDetailModalProps {
  swimmer: Swimmer | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (swimmer: Swimmer) => void;
  onDecline?: (swimmer: Swimmer) => void;
  onRefresh?: () => void;
}

export function SwimmerDetailModal({
  swimmer,
  isOpen,
  onClose,
  onApprove,
  onDecline,
  onRefresh,
}: SwimmerDetailModalProps) {
  const router = useRouter();

  if (!swimmer) return null;

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
    onClose();
    router.push(`/admin/swimmers/${swimmer.id}/edit`);
  };

  const handleBookSession = () => {
    onClose();
    router.push(`/booking?swimmer=${swimmer.id}`);
  };

  const handleViewFullPage = () => {
    onClose();
    router.push(`/admin/swimmers/${swimmer.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {swimmer.photoUrl ? (
                <img
                  src={swimmer.photoUrl}
                  alt={swimmer.fullName}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(swimmer.firstName, swimmer.lastName)}
                  </span>
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-bold">{swimmer.fullName}</DialogTitle>
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
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleBookSession}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Book Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewFullPage}
            >
              View Full Page
            </Button>
            {swimmer.enrollmentStatus === 'waitlist' && onApprove && onDecline && (
              <>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => onApprove(swimmer)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDecline(swimmer)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

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
                  <span className="text-xs text-muted-foreground">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: '65%' }}
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
      </DialogContent>
    </Dialog>
  );
}