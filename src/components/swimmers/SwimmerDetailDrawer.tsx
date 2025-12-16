"use client"

import { useState } from "react"
import { Mail, Phone, AlertTriangle, User, Award, Calendar, ChevronDown, ChevronUp, Target, Shield } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Types from SwimmerManagementTable
interface Swimmer {
  id: string
  parentId: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth?: string
  age?: number
  enrollmentStatus: string
  assessmentStatus: string
  currentLevel?: {
    id: string
    name: string
    displayName: string
    color?: string
  } | null
  paymentType: string
  hasFundingAuthorization: boolean
  photoUrl?: string
  vmrcSessionsUsed?: number
  vmrcSessionsAuthorized?: number
  vmrcCurrentPosNumber?: string
  vmrcPosExpiresAt?: string
  createdAt: string
  updatedAt: string
  parent?: {
    id: string
    fullName?: string
    email?: string
    phone?: string
  } | null
  lessonsCompleted: number
  nextSession?: {
    startTime: string
    instructorName?: string
  } | null
  // Additional fields for detail view
  gender?: string
  diagnosis?: string[]
  swimGoals?: string[]
  hasAllergies?: boolean
  allergiesDescription?: string
  hasMedicalConditions?: boolean
  medicalConditionsDescription?: string
  historyOfSeizures?: boolean
  toiletTrained?: boolean
  nonAmbulatory?: boolean
  selfInjuriousBehavior?: boolean
  selfInjuriousDescription?: string
  aggressiveBehavior?: boolean
  aggressiveBehaviorDescription?: string
  elopementHistory?: boolean
  elopementDescription?: string
  previousSwimLessons?: boolean
  comfortableInWater?: string
  flexibleSwimmer?: boolean
  signedWaiver?: boolean
  photoRelease?: boolean
}

interface SwimmerDetailDrawerProps {
  swimmer: Swimmer | null
  open: boolean
  onClose: () => void
  role: "admin" | "instructor"
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
}

// Status badge colors
const statusColors: Record<string, string> = {
  enrolled: "bg-green-100 text-green-800 border-green-200",
  waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  dropped: "bg-red-100 text-red-800 border-red-200",
}

// Payment type colors
const paymentColors: Record<string, string> = {
  private_pay: "bg-blue-100 text-blue-800 border-blue-200",
  vmrc: "bg-purple-100 text-purple-800 border-purple-200",
  scholarship: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

// Status display names
const statusDisplay: Record<string, string> = {
  enrolled: "Enrolled",
  waitlist: "Waitlist",
  pending: "Pending Approval",
  inactive: "Inactive",
  dropped: "Dropped",
}

// Payment type display names
const paymentDisplay: Record<string, string> = {
  private_pay: "Private Pay",
  vmrc: "VMRC",
  scholarship: "Scholarship",
  other: "Other",
}

export default function SwimmerDetailDrawer({
  swimmer,
  open,
  onClose,
  role,
  onApprove,
  onDecline,
}: SwimmerDetailDrawerProps) {
  const [showMedicalDetails, setShowMedicalDetails] = useState(false)
  const [showBehaviorDetails, setShowBehaviorDetails] = useState(false)

  if (!swimmer) return null

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "—"
    }
  }

  // Format next session
  const formatNextSession = (nextSession?: { startTime: string; instructorName?: string }) => {
    if (!nextSession?.startTime) return null

    const date = new Date(nextSession.startTime)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dayDisplay = ""
    if (date.toDateString() === today.toDateString()) {
      dayDisplay = "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayDisplay = "Tomorrow"
    } else {
      dayDisplay = date.toLocaleDateString("en-US", { weekday: "short" })
    }

    const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    return `${dayDisplay} ${time}`
  }

  // Get lesson milestone emoji
  const getLessonMilestone = (count: number) => {
    if (count >= 50) return "🏆"
    if (count >= 25) return "⭐"
    if (count >= 10) return "🎯"
    if (count >= 5) return "✨"
    return ""
  }

  // Check if there are medical alerts
  const hasMedicalAlerts =
    swimmer.hasAllergies ||
    swimmer.hasMedicalConditions ||
    swimmer.historyOfSeizures ||
    swimmer.nonAmbulatory

  // Check if there are behavior alerts
  const hasBehaviorAlerts =
    swimmer.selfInjuriousBehavior || swimmer.aggressiveBehavior || swimmer.elopementHistory

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={swimmer.photoUrl} alt={swimmer.fullName} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                {getInitials(swimmer.firstName, swimmer.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{swimmer.fullName}</SheetTitle>
              <SheetDescription>
                {swimmer.age ? `${swimmer.age} years old` : "Age not specified"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Funding Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn(statusColors[swimmer.enrollmentStatus])}>
              {statusDisplay[swimmer.enrollmentStatus] || swimmer.enrollmentStatus}
            </Badge>
            <Badge variant="outline" className={cn(paymentColors[swimmer.paymentType])}>
              {paymentDisplay[swimmer.paymentType] || swimmer.paymentType}
            </Badge>
            {swimmer.currentLevel && (
              <Badge variant="outline" className="border-blue-200">
                {swimmer.currentLevel.displayName}
              </Badge>
            )}
            {swimmer.hasFundingAuthorization && (
              <Badge variant="outline" className="border-purple-200">
                VMRC Client
              </Badge>
            )}
          </div>

          {/* Parent Contact */}
          {swimmer.parent && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Parent Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">{swimmer.parent.fullName}</div>
                  </div>
                  {swimmer.parent.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${swimmer.parent.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {swimmer.parent.email}
                      </a>
                    </div>
                  )}
                  {swimmer.parent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${swimmer.parent.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {swimmer.parent.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Alerts */}
          {hasMedicalAlerts && (
            <Card className={cn("border-amber-200", showMedicalDetails && "border-amber-300")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Medical Alerts
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMedicalDetails(!showMedicalDetails)}
                    className="h-8"
                  >
                    {showMedicalDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {swimmer.hasAllergies && (
                    <div className="text-sm">
                      <span className="font-medium">Allergies:</span>{" "}
                      {swimmer.allergiesDescription || "Yes (no details provided)"}
                    </div>
                  )}
                  {swimmer.hasMedicalConditions && (
                    <div className="text-sm">
                      <span className="font-medium">Medical Conditions:</span>{" "}
                      {swimmer.medicalConditionsDescription || "Yes (no details provided)"}
                    </div>
                  )}
                  {swimmer.historyOfSeizures && (
                    <div className="text-sm">
                      <span className="font-medium">History of Seizures:</span> Yes
                    </div>
                  )}
                  {swimmer.nonAmbulatory && (
                    <div className="text-sm">
                      <span className="font-medium">Non-Ambulatory:</span> Yes
                    </div>
                  )}

                  {showMedicalDetails && (
                    <div className="pt-3 space-y-3 border-t mt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Toilet Trained:</span>{" "}
                          {swimmer.toiletTrained === true
                            ? "Yes"
                            : swimmer.toiletTrained === false
                              ? "No"
                              : "Not specified"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Previous Lessons:</span>{" "}
                          {swimmer.previousSwimLessons ? "Yes" : "No"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comfort in Water:</span>{" "}
                          {swimmer.comfortableInWater || "Not specified"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Flexible Swimmer:</span>{" "}
                          {swimmer.flexibleSwimmer ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavior Alerts */}
          {hasBehaviorAlerts && (
            <Card className={cn("border-red-200", showBehaviorDetails && "border-red-300")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    Behavior Notes
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBehaviorDetails(!showBehaviorDetails)}
                    className="h-8"
                  >
                    {showBehaviorDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {swimmer.selfInjuriousBehavior && (
                    <div className="text-sm">
                      <span className="font-medium">Self-Injurious Behavior:</span>{" "}
                      {swimmer.selfInjuriousDescription || "Yes (no details provided)"}
                    </div>
                  )}
                  {swimmer.aggressiveBehavior && (
                    <div className="text-sm">
                      <span className="font-medium">Aggressive Behavior:</span>{" "}
                      {swimmer.aggressiveBehaviorDescription || "Yes (no details provided)"}
                    </div>
                  )}
                  {swimmer.elopementHistory && (
                    <div className="text-sm">
                      <span className="font-medium">Elopement History:</span>{" "}
                      {swimmer.elopementDescription || "Yes (no details provided)"}
                    </div>
                  )}

                  {showBehaviorDetails && (
                    <div className="pt-3 space-y-3 border-t mt-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Assessment Status:</span>{" "}
                        {swimmer.assessmentStatus || "Not started"}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Swimmer Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Swimmer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Gender</div>
                  <div className="font-medium">{swimmer.gender || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Birth</div>
                  <div className="font-medium">{formatDate(swimmer.dateOfBirth)}</div>
                </div>
              </div>

              {/* Diagnosis Tags */}
              {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Diagnosis</div>
                  <div className="flex flex-wrap gap-2">
                    {swimmer.diagnosis.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Swim Goals */}
              {swimmer.swimGoals && swimmer.swimGoals.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Swim Goals
                  </div>
                  <ul className="space-y-1">
                    {swimmer.swimGoals.map((goal, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress & Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Level</div>
                    <div className="text-xl font-bold">
                      {swimmer.currentLevel?.displayName || "Not assigned"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Lessons Completed</div>
                    <div className="text-3xl font-bold flex items-center gap-2">
                      {swimmer.lessonsCompleted}
                      {getLessonMilestone(swimmer.lessonsCompleted) && (
                        <span className="text-2xl">{getLessonMilestone(swimmer.lessonsCompleted)}</span>
                      )}
                    </div>
                  </div>
                  {swimmer.hasFundingAuthorization && swimmer.vmrcSessionsAuthorized && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground">VMRC Sessions</div>
                      <div className="font-medium">
                        {swimmer.vmrcSessionsUsed || 0} / {swimmer.vmrcSessionsAuthorized} used
                      </div>
                      {swimmer.vmrcCurrentPosNumber && (
                        <div className="text-xs text-muted-foreground mt-1">
                          PO: {swimmer.vmrcCurrentPosNumber}
                          {swimmer.vmrcPosExpiresAt && ` (expires ${formatDate(swimmer.vmrcPosExpiresAt)})`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Sessions
                </h3>
                {swimmer.nextSession ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Next Session</div>
                      <div className="text-xl font-bold">
                        {formatNextSession(swimmer.nextSession)}
                      </div>
                      {swimmer.nextSession.instructorName && (
                        <div className="text-sm text-muted-foreground">
                          with {swimmer.nextSession.instructorName}
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground">Recent Sessions</div>
                      <div className="text-sm space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span>This week</span>
                          <span className="font-medium">2 sessions</span>
                        </div>
                        <div className="flex justify-between">
                          <span>This month</span>
                          <span className="font-medium">8 sessions</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance rate</span>
                          <span className="font-medium text-green-600">94%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <div className="text-muted-foreground">No upcoming sessions</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      This swimmer has no scheduled sessions
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legal Status */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">Legal & Consent</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Liability Waiver</div>
                  <div className="font-medium">
                    {swimmer.signedWaiver ? (
                      <span className="text-green-600">Signed</span>
                    ) : (
                      <span className="text-red-600">Not signed</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Photo Release</div>
                  <div className="font-medium">
                    {swimmer.photoRelease ? (
                      <span className="text-green-600">Approved</span>
                    ) : (
                      <span className="text-amber-600">Not approved</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>

              {role === "admin" && swimmer.enrollmentStatus === "pending" && (
                <>
                  {onApprove && (
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(swimmer.id)}
                    >
                      Approve
                    </Button>
                  )}
                  {onDecline && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onDecline(swimmer.id)}
                    >
                      Decline
                    </Button>
                  )}
                </>
              )}

              {role === "admin" && swimmer.enrollmentStatus !== "pending" && (
                <Button className="flex-1">Edit Swimmer</Button>
              )}

              {role === "instructor" && (
                <Button className="flex-1">Add Progress Note</Button>
              )}

              <Button variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}