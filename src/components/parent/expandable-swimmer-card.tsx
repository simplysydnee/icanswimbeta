'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LevelBadge } from './level-badge'
import { LessonCountBadge } from './lesson-count-badge'
import {
  Calendar,
  X,
  Phone,
  Mail,
  AlertCircle,
  Target,
  Award,
  Edit,
  ChevronRight,
  User,
  Stethoscope,
  Heart,
  AlertTriangle,
  DollarSign,
  Info,
  Waves,
  MessageSquare,
  ShieldAlert
} from 'lucide-react'

interface ExpandableSwimmerCardProps {
  swimmer: {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string
    gender?: string
    height?: string | number
    weight?: string | number
    photo_url?: string
    enrollment_status: string
    current_level?: {
      name: string
      display_name: string
      color?: string
    }
    funding_source_id?: boolean
    payment_type?: string
    funding_source_name?: string
    funding_coordinator_name?: string
    funding_coordinator_email?: string
    funding_coordinator_phone?: string
    authorized_sessions_used?: number
    authorized_sessions_total?: number
    lessons_completed?: number
    next_session?: {
      start_time?: string
      instructor_name?: string
    }
    // Medical
    diagnosis?: string[]
    has_allergies?: boolean
    allergies_description?: string
    has_medical_conditions?: boolean
    medical_conditions_description?: string
    history_of_seizures?: boolean
    seizures_description?: string
    toilet_trained?: string
    non_ambulatory?: boolean
    // Behavioral
    self_injurious_behavior?: boolean
    self_injurious_behavior_description?: string
    aggressive_behavior?: boolean
    aggressive_behavior_description?: string
    elopement_history?: boolean
    elopement_history_description?: string
    has_behavior_plan?: boolean
    restraint_history?: boolean
    restraint_history_description?: string
    // Fundamental
    communication_type?: string | string[]
    strengths_interests?: string
    other_therapies?: boolean
    therapies_description?: string
    // Swim background
    swim_goals?: string[]
    previous_swim_lessons?: boolean
    comfortable_in_water?: string
    // Scheduling
    flexible_swimmer?: boolean
    // Emergency contact
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    // Parent contact info (for reference)
    parent_phone?: string
    parent_email?: string
  }
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
}

export function ExpandableSwimmerCard({
  swimmer,
  isExpanded,
  onExpand,
  onCollapse
}: ExpandableSwimmerCardProps) {
  const [isMedicalExpanded, setIsMedicalExpanded] = useState(false)
  const [isBehavioralExpanded, setIsBehavioralExpanded] = useState(false)

  const formatYesNo = (v?: boolean) => (v === true ? 'Yes' : v === false ? 'No' : null)
  const formatLabel = (v?: string) =>
    v ? v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
  const joinList = (v?: string | string[]) =>
    Array.isArray(v) ? v.filter(Boolean).join(', ') : v || ''

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      waitlist: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      enrolled: 'bg-green-100 text-green-800 border-green-200',
      dropped: 'bg-red-100 text-red-800 border-red-200',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      waitlist: 'Waitlist',
      pending: 'Pending',
      enrolled: 'Enrolled',
      dropped: 'Dropped',
    }
    return statusMap[status] || status
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const formatNextSession = (nextSession?: { start_time?: string; instructor_name?: string }) => {
    if (!nextSession?.start_time) return null

    const date = new Date(nextSession.start_time)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dayDisplay = ''
    if (date.toDateString() === today.toDateString()) {
      dayDisplay = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayDisplay = 'Tomorrow'
    } else {
      dayDisplay = date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    return `${dayDisplay} ${time}`
  }

  const age = calculateAge(swimmer.date_of_birth)
  const nextSessionDisplay = formatNextSession(swimmer.next_session)
  const hasFundingAuthorization = swimmer.funding_source_id || swimmer.payment_type === 'vmrc'
  const formattedDob = swimmer.date_of_birth
    ? new Date(swimmer.date_of_birth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const hasDemographics = !!(formattedDob || swimmer.gender || swimmer.height || swimmer.weight)
  const hasParentContact = !!(swimmer.parent_phone || swimmer.parent_email)
  const hasEmergencyContact = !!(
    swimmer.emergency_contact_name ||
    swimmer.emergency_contact_phone ||
    swimmer.emergency_contact_relationship
  )
  const hasFundingDetails =
    hasFundingAuthorization &&
    !!(
      swimmer.funding_source_name ||
      swimmer.funding_coordinator_name ||
      swimmer.funding_coordinator_email ||
      swimmer.funding_coordinator_phone ||
      swimmer.authorized_sessions_total != null ||
      swimmer.authorized_sessions_used != null
    )
  const hasMedicalDetails = !!(
    swimmer.has_allergies ||
    swimmer.has_medical_conditions ||
    swimmer.history_of_seizures ||
    swimmer.toilet_trained ||
    swimmer.non_ambulatory ||
    (swimmer.diagnosis && swimmer.diagnosis.length > 0)
  )
  const hasBehavioralDetails = !!(
    swimmer.self_injurious_behavior ||
    swimmer.aggressive_behavior ||
    swimmer.elopement_history ||
    swimmer.has_behavior_plan ||
    swimmer.restraint_history
  )
  const hasFundamentalInfo = !!(
    swimmer.communication_type ||
    swimmer.strengths_interests ||
    swimmer.other_therapies
  )
  const hasSwimBackground = !!(
    swimmer.previous_swim_lessons !== undefined ||
    swimmer.comfortable_in_water ||
    (swimmer.swim_goals && swimmer.swim_goals.length > 0) ||
    swimmer.flexible_swimmer !== undefined
  )

  // Handle escape key to collapse
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        onCollapse()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isExpanded, onCollapse])

  // Collapsed card view
  const collapsedCard = (
    <motion.div
      layoutId={`swimmer-card-${swimmer.id}`}
      onClick={onExpand}
      className="cursor-pointer h-full"
    >
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getInitials(swimmer.first_name, swimmer.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">
                  {swimmer.first_name} {swimmer.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {age ? `${age} years old` : 'Age not specified'}
                </div>
                <div className="mt-1">
                  {swimmer.current_level ? (
                    <LevelBadge level={swimmer.current_level} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-500">No level assigned</span>
                  )}
                </div>
              </div>
            </div>
            {hasFundingAuthorization && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                {swimmer.payment_type}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Badge
                variant="outline"
                className={`${getStatusColor(swimmer.enrollment_status)} text-xs`}
              >
                {getStatusDisplay(swimmer.enrollment_status)}
              </Badge>
              {swimmer.lessons_completed !== undefined && swimmer.lessons_completed > 0 && (
                <LessonCountBadge count={swimmer.lessons_completed} size="sm" />
              )}
            </div>

            {nextSessionDisplay ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-2 rounded-md">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Next: {nextSessionDisplay}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No upcoming sessions
              </div>
            )}
          </div>
        </CardContent>
        <div className="px-6 pb-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground flex justify-between items-center">
            <span>Click to view details</span>
            <span className="text-blue-600 font-medium">→</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )

  // Expanded card view
  const expandedCard = (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCollapse}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Expanded Card */}
      <motion.div
        layoutId={`swimmer-card-${swimmer.id}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 md:inset-20 lg:inset-40 z-50 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header with close button */}
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {getInitials(swimmer.first_name, swimmer.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {swimmer.first_name} {swimmer.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {age && (
                      <span className="text-muted-foreground">
                        {age} years old
                      </span>
                    )}
                    {swimmer.current_level && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <LevelBadge level={swimmer.current_level} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Status Row */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                variant="outline"
                className={`${getStatusColor(swimmer.enrollment_status)}`}
              >
                {getStatusDisplay(swimmer.enrollment_status)}
              </Badge>

              {!swimmer.current_level && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Pending Assessment
                </Badge>
              )}

              {hasFundingAuthorization && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  Funded Client
                </Badge>
              )}

              {swimmer.lessons_completed !== undefined && swimmer.lessons_completed > 0 && (
                <LessonCountBadge count={swimmer.lessons_completed} />
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-8">
            {/* Demographics */}
            {hasDemographics && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Demographics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {formattedDob && (
                    <div>
                      <div className="text-xs text-muted-foreground">Date of Birth</div>
                      <div>
                        {formattedDob}
                        {age != null && <span className="text-muted-foreground"> ({age} yrs)</span>}
                      </div>
                    </div>
                  )}
                  {swimmer.gender && (
                    <div>
                      <div className="text-xs text-muted-foreground">Gender</div>
                      <div>{formatLabel(swimmer.gender)}</div>
                    </div>
                  )}
                  {swimmer.height && (
                    <div>
                      <div className="text-xs text-muted-foreground">Height</div>
                      <div>{swimmer.height}</div>
                    </div>
                  )}
                  {swimmer.weight && (
                    <div>
                      <div className="text-xs text-muted-foreground">Weight</div>
                      <div>{swimmer.weight}</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Parent Contact */}
            {hasParentContact && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Parent Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {swimmer.parent_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{swimmer.parent_phone}</span>
                    </div>
                  )}
                  {swimmer.parent_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{swimmer.parent_email}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Emergency Contact */}
            {hasEmergencyContact && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {swimmer.emergency_contact_name && (
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div>{swimmer.emergency_contact_name}</div>
                    </div>
                  )}
                  {swimmer.emergency_contact_relationship && (
                    <div>
                      <div className="text-xs text-muted-foreground">Relationship</div>
                      <div>{swimmer.emergency_contact_relationship}</div>
                    </div>
                  )}
                  {swimmer.emergency_contact_phone && (
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{swimmer.emergency_contact_phone}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Funded-Client Info */}
            {hasFundingDetails && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Funding
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {swimmer.funding_source_name && (
                    <div>
                      <div className="text-xs text-muted-foreground">Funding Source</div>
                      <div>{swimmer.funding_source_name}</div>
                    </div>
                  )}
                  {(swimmer.authorized_sessions_total != null ||
                    swimmer.authorized_sessions_used != null) && (
                    <div>
                      <div className="text-xs text-muted-foreground">Authorized Sessions</div>
                      <div>
                        {swimmer.authorized_sessions_used ?? 0}
                        {swimmer.authorized_sessions_total != null && (
                          <span> of {swimmer.authorized_sessions_total}</span>
                        )}
                        <span className="text-muted-foreground"> used</span>
                      </div>
                    </div>
                  )}
                  {swimmer.funding_coordinator_name && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Coordinator</div>
                      <div>{swimmer.funding_coordinator_name}</div>
                    </div>
                  )}
                  {swimmer.funding_coordinator_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{swimmer.funding_coordinator_phone}</span>
                    </div>
                  )}
                  {swimmer.funding_coordinator_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="break-all">{swimmer.funding_coordinator_email}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Medical */}
            {hasMedicalDetails && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Medical
                </h3>

                {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</h4>
                    <div className="flex flex-wrap gap-2">
                      {swimmer.diagnosis.map((d, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  {swimmer.toilet_trained && (
                    <div>
                      <div className="text-xs text-muted-foreground">Toilet Trained</div>
                      <div>{formatLabel(swimmer.toilet_trained)}</div>
                    </div>
                  )}
                  {swimmer.non_ambulatory !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Non-Ambulatory</div>
                      <div>{formatYesNo(swimmer.non_ambulatory)}</div>
                    </div>
                  )}
                </div>

                {(swimmer.has_allergies || swimmer.has_medical_conditions || swimmer.history_of_seizures) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setIsMedicalExpanded(!isMedicalExpanded)}
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
                            {swimmer.has_allergies && (
                              <div>
                                <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4" />
                                  Allergies
                                </h5>
                                <p className="text-sm">
                                  {swimmer.allergies_description || 'Allergies reported'}
                                </p>
                              </div>
                            )}

                            {swimmer.has_medical_conditions && (
                              <div>
                                <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <Heart className="h-4 w-4" />
                                  Medical Conditions
                                </h5>
                                <p className="text-sm">
                                  {swimmer.medical_conditions_description || 'Medical conditions reported'}
                                </p>
                              </div>
                            )}

                            {swimmer.history_of_seizures && (
                              <div>
                                <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Seizure History
                                </h5>
                                <p className="text-sm">
                                  {swimmer.seizures_description || 'Seizure history reported'}
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
            )}

            {/* Behavioral */}
            {hasBehavioralDetails && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Behavioral
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsBehavioralExpanded(!isBehavioralExpanded)}
                    className="w-full p-3 bg-amber-50 flex items-center justify-between hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-800">Behavioral Notes</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 text-amber-600 transition-transform ${isBehavioralExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isBehavioralExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3 text-sm">
                          {swimmer.self_injurious_behavior && (
                            <div>
                              <h5 className="font-medium mb-1">Self-Injurious Behavior</h5>
                              <p>{swimmer.self_injurious_behavior_description || 'Reported'}</p>
                            </div>
                          )}
                          {swimmer.aggressive_behavior && (
                            <div>
                              <h5 className="font-medium mb-1">Aggressive Behavior</h5>
                              <p>{swimmer.aggressive_behavior_description || 'Reported'}</p>
                            </div>
                          )}
                          {swimmer.elopement_history && (
                            <div>
                              <h5 className="font-medium mb-1">Elopement History</h5>
                              <p>{swimmer.elopement_history_description || 'Reported'}</p>
                            </div>
                          )}
                          {swimmer.restraint_history && (
                            <div>
                              <h5 className="font-medium mb-1">Restraint History</h5>
                              <p>{swimmer.restraint_history_description || 'Reported'}</p>
                            </div>
                          )}
                          {swimmer.has_behavior_plan && (
                            <div>
                              <h5 className="font-medium mb-1">Behavior Plan</h5>
                              <p>On file</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Fundamental Info */}
            {hasFundamentalInfo && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Fundamental Info
                </h3>
                <div className="space-y-3 text-sm">
                  {swimmer.communication_type && (
                    <div>
                      <div className="text-xs text-muted-foreground">Communication</div>
                      <div>
                        {Array.isArray(swimmer.communication_type)
                          ? swimmer.communication_type.map(formatLabel).filter(Boolean).join(', ')
                          : formatLabel(swimmer.communication_type)}
                      </div>
                    </div>
                  )}
                  {swimmer.strengths_interests && (
                    <div>
                      <div className="text-xs text-muted-foreground">Strengths &amp; Interests</div>
                      <div className="whitespace-pre-wrap">{swimmer.strengths_interests}</div>
                    </div>
                  )}
                  {swimmer.other_therapies && (
                    <div>
                      <div className="text-xs text-muted-foreground">Other Therapies</div>
                      <div>{swimmer.therapies_description || 'Reported'}</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Swim Background */}
            {hasSwimBackground && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Swim Background
                </h3>

                {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Swim Goals
                    </h4>
                    <ul className="space-y-1">
                      {swimmer.swim_goals.map((goal, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {swimmer.previous_swim_lessons !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Previous Swim Lessons</div>
                      <div>{formatYesNo(swimmer.previous_swim_lessons)}</div>
                    </div>
                  )}
                  {swimmer.comfortable_in_water && (
                    <div>
                      <div className="text-xs text-muted-foreground">Comfortable in Water</div>
                      <div>{formatLabel(swimmer.comfortable_in_water)}</div>
                    </div>
                  )}
                  {swimmer.flexible_swimmer !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Flexible Schedule</div>
                      <div>{formatYesNo(swimmer.flexible_swimmer)}</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Progress (lessons + next session tiles) */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Progress
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {swimmer.lessons_completed || 0}
                  </div>
                  <div className="text-xs text-blue-800">Lessons Completed</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  {nextSessionDisplay ? (
                    <>
                      <div className="text-sm font-medium text-green-800">
                        {nextSessionDisplay}
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
            </section>

            {/* Staff-managed note */}
            <div className="text-xs text-muted-foreground flex items-start gap-2 bg-gray-50 p-3 rounded-md">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Funding details and waiver/consent fields are managed by staff. All other
                information can be edited via the Edit button.
              </span>
            </div>

            {/* Action Buttons */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button asChild className="w-full">
                  <Link href={`/parent/book?swimmer=${swimmer.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Session
                  </Link>
                </Button>

                {/* <Button variant="outline" asChild className="w-full">
                  <Link href={`/parent/swimmers/${swimmer.id}/progress`}>
                    <Award className="h-4 w-4 mr-2" />
                    View Full Progress
                  </Link>
                </Button> */}

                <Button variant="outline" asChild className="w-full">
                  <Link href={`/parent/swimmers/${swimmer.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Info
                  </Link>
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )

  return (
    <>
      {collapsedCard}
      <AnimatePresence>
        {isExpanded && expandedCard}
      </AnimatePresence>
    </>
  )
}