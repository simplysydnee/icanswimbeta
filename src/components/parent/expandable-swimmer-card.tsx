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
  Heart
} from 'lucide-react'

interface ExpandableSwimmerCardProps {
  swimmer: {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string
    photo_url?: string
    enrollment_status: string
    current_level?: {
      name: string
      display_name: string
      color?: string
    }
    funding_source_id?: boolean
    payment_type?: string
    lessons_completed?: number
    next_session?: {
      start_time?: string
      instructor_name?: string
    }
    // Additional fields for expanded view
    diagnosis?: string[]
    swim_goals?: string[]
    has_allergies?: boolean
    allergies_description?: string
    has_medical_conditions?: boolean
    medical_conditions_description?: string
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

  // Calculate progress percentage for current level (mock data for now)
  const progressPercentage = swimmer.current_level ? 65 : 0 // Mock: 65% progress

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
                Funded
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
            {/* Contact Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Contact on File
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
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
                {(!swimmer.parent_phone && !swimmer.parent_email) && (
                  <p className="text-sm text-muted-foreground">
                    Contact information not available
                  </p>
                )}
              </div>
            </section>

            {/* Swimmer Details */}
            <section>
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
              {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Swim Goals
                  </h4>
                  <ul className="space-y-1">
                    {swimmer.swim_goals.map((goal, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Alerts */}
              {(swimmer.has_allergies || swimmer.has_medical_conditions) && (
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Progress Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Progress
              </h3>

              <div className="space-y-4">
                {/* Current Level Progress */}
                {swimmer.current_level && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{swimmer.current_level.display_name}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {swimmer.lessons_completed || 0}
                    </div>
                    <div className="text-xs text-blue-800">Lessons Completed</div>
                  </div>

                  {/* Next Session */}
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
              </div>
            </section>

            {/* Action Buttons */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-3">
                <Button asChild className="w-full">
                  <Link href={`/parent/book?swimmer=${swimmer.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Session
                  </Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href={`/parent/swimmers/${swimmer.id}/progress`}>
                    <Award className="h-4 w-4 mr-2" />
                    View Full Progress
                  </Link>
                </Button>

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