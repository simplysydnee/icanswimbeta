'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LevelBadge } from './level-badge'
import { LessonCountBadge } from './lesson-count-badge'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar,
  X,
  Phone,
  Mail,
  AlertCircle,
  Target,
  Edit,
  ChevronRight,
  User,
  Stethoscope,
  Heart,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  Circle,
  Clock,
  Activity,
} from 'lucide-react'

interface Skill {
  id: string
  name: string
  description?: string
  sequence: number
  level: {
    id: string
    name: string
    display_name: string
    color?: string
  }
  status: 'not_started' | 'in_progress' | 'mastered'
  date_mastered?: string
}

interface Assessment {
  id: string
  status: string
  completed_at?: string
  recommended_level?: string
  notes?: string
  assessed_by?: string
  comfort_in_water?: string
  session?: { start_time: string; location?: string; instructor?: { full_name: string } }
}

interface BookingHistory {
  id: string
  status: string
  created_at: string
  session?: {
    start_time: string
    end_time: string
    location?: string
    instructor?: { full_name: string }
  }
}

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
    funding_source_requires_authorization?: boolean
    payment_type?: string
    funding_source_name?: string
    funding_coordinator_name?: string
    active_purchase_order?: {
      sessions_authorized: number
      sessions_used: number
      unexcused_late_cancel_count: number
      sessions_remaining: number
    } | null
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
  const [activeTab, setActiveTab] = useState('overview')
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [bookings, setBookings] = useState<BookingHistory[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  // Inline edit state — emergency contact
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [emergencyForm, setEmergencyForm] = useState({
    emergency_contact_name: swimmer.emergency_contact_name ?? '',
    emergency_contact_relationship: swimmer.emergency_contact_relationship ?? '',
    emergency_contact_phone: swimmer.emergency_contact_phone ?? '',
  })
  const [emergencySaving, setEmergencySaving] = useState(false)
  // Inline edit state — coordinator (funded swimmers only)
  const [editingCoordinator, setEditingCoordinator] = useState(false)
  const [coordinatorForm, setCoordinatorForm] = useState({
    funding_coordinator_name: swimmer.funding_coordinator_name ?? '',
    funding_coordinator_email: swimmer.funding_coordinator_email ?? '',
    funding_coordinator_phone: swimmer.funding_coordinator_phone ?? '',
  })
  const [coordinatorSaving, setCoordinatorSaving] = useState(false)
  const supabase = createClient()

  const saveEmergencyContact = async () => {
    setEmergencySaving(true)
    try {
      const { error } = await supabase
        .from('swimmers')
        .update({
          emergency_contact_name: emergencyForm.emergency_contact_name || null,
          emergency_contact_relationship: emergencyForm.emergency_contact_relationship || null,
          emergency_contact_phone: emergencyForm.emergency_contact_phone || null,
        })
        .eq('id', swimmer.id)
      if (!error) setEditingEmergency(false)
    } finally {
      setEmergencySaving(false)
    }
  }

  const saveCoordinator = async () => {
    setCoordinatorSaving(true)
    try {
      const { error } = await supabase
        .from('swimmers')
        .update({
          funding_coordinator_name: coordinatorForm.funding_coordinator_name || null,
          funding_coordinator_email: coordinatorForm.funding_coordinator_email || null,
          funding_coordinator_phone: coordinatorForm.funding_coordinator_phone || null,
        })
        .eq('id', swimmer.id)
      if (!error) setEditingCoordinator(false)
    } finally {
      setCoordinatorSaving(false)
    }
  }

  const fetchAssessments = useCallback(async () => {
    if (!swimmer.id || assessments.length > 0) return
    setAssessmentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id, status, completed_at, recommended_level, notes, assessed_by,
          comfort_in_water,
          session:sessions(start_time, location, instructor:profiles!instructor_id(full_name))
        `)
        .eq('swimmer_id', swimmer.id)
        .order('completed_at', { ascending: false })
      if (!error && data) setAssessments(data as any)
    } finally {
      setAssessmentsLoading(false)
    }
  }, [swimmer.id, assessments.length, supabase])

  const fetchBookings = useCallback(async () => {
    if (!swimmer.id || bookings.length > 0) return
    setBookingsLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, created_at,
          session:sessions(start_time, end_time, location, instructor:profiles!instructor_id(full_name))
        `)
        .eq('swimmer_id', swimmer.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error && data) setBookings(data as any)
    } finally {
      setBookingsLoading(false)
    }
  }, [swimmer.id, bookings.length, supabase])

  const fetchSkills = useCallback(async () => {
    if (!swimmer.id || skills.length > 0) return
    setSkillsLoading(true)
    try {
      const { data, error } = await supabase
        .from('swimmer_skills')
        .select(`
          id,
          status,
          date_mastered,
          skill:skills(id, name, description, sequence, level:swim_levels(id, name, display_name, color))
        `)
        .eq('swimmer_id', swimmer.id)
        .order('sequence', { referencedTable: 'skills', ascending: true })

      if (!error && data) {
        const mapped: Skill[] = data.map((row: any) => ({
          id: row.id,
          name: row.skill?.name ?? '',
          description: row.skill?.description,
          sequence: row.skill?.sequence ?? 0,
          level: row.skill?.level ?? { id: '', name: '', display_name: '' },
          status: row.status,
          date_mastered: row.date_mastered,
        }))
        setSkills(mapped)
      }
    } finally {
      setSkillsLoading(false)
    }
  }, [swimmer.id, skills.length, supabase])

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

  // Fetch data when expanded or tab changes
  useEffect(() => {
    if (!isExpanded) return
    fetchSkills()
    if (activeTab === 'assessments') fetchAssessments()
    if (activeTab === 'history') fetchBookings()
  }, [isExpanded, activeTab, fetchSkills, fetchAssessments, fetchBookings])

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

            {/* Authorization Summary for VMRC/CVRC swimmers */}
            {swimmer.funding_source_requires_authorization && swimmer.active_purchase_order && (
              <div className="border border-purple-200 bg-purple-50/40 rounded-md p-2.5 space-y-1">
                <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wide">
                  Authorization Summary
                </p>
                <p className="text-sm text-purple-900">
                  {swimmer.active_purchase_order.sessions_remaining} of {swimmer.active_purchase_order.sessions_authorized} lessons remaining
                </p>
                <div className="flex gap-3 text-xs text-purple-700">
                  <span>0 cancelled</span>
                  <span>
                    {swimmer.active_purchase_order.unexcused_late_cancel_count} late cancels
                    {swimmer.active_purchase_order.unexcused_late_cancel_count >= 1 && (
                      <span className="text-amber-600 ml-1">⚠️</span>
                    )}
                  </span>
                </div>
                {swimmer.active_purchase_order.unexcused_late_cancel_count >= 1 && (
                  <p className="text-[11px] text-amber-700 leading-tight">
                    Late cancellations may result in removal from program
                  </p>
                )}
                {swimmer.active_purchase_order.unexcused_late_cancel_count >= 2 && (
                  <p className="text-[11px] text-red-700 leading-tight">
                    At risk of being dropped from the program
                  </p>
                )}
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

  // Skills helpers
  const masteredSkills = skills.filter(s => s.status === 'mastered')
  const inProgressSkills = skills.filter(s => s.status === 'in_progress')
  const skillsByLevel = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const levelName = skill.level.display_name || skill.level.name
    if (!acc[levelName]) acc[levelName] = []
    acc[levelName].push(skill)
    return acc
  }, {})

  // Expanded card view — admin-style layout
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
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-2 md:inset-8 lg:inset-16 z-50 flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full flex flex-col overflow-hidden">

          {/* ── Sticky Header ── */}
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 border border-border">
                  <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                    {getInitials(swimmer.first_name, swimmer.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold leading-tight truncate">
                      {swimmer.first_name} {swimmer.last_name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {age && <span className="text-xs text-muted-foreground">{age} yrs</span>}
                    {swimmer.current_level && (
                      <>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs font-medium">{swimmer.current_level.display_name}</span>
                      </>
                    )}
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className={`${getStatusColor(swimmer.enrollment_status)} text-xs py-0 px-1.5 h-4`}>
                      {getStatusDisplay(swimmer.enrollment_status)}
                    </Badge>
                    {hasFundingAuthorization && (
                      <Badge variant="outline" className="bg-violet-100 text-violet-800 border-violet-200 text-xs py-0 px-1.5 h-4">
                        Funded
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 hidden sm:flex" asChild>
                  <Link href={`/parent/swimmers/${swimmer.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCollapse}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div className="px-4 pt-2 shrink-0 border-b">
            {/* Mobile dropdown */}
            <div className="block md:hidden pb-2">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="h-8 text-sm w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="assessments">Assessments</SelectItem>
                  <SelectItem value="history">Booking History</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-0">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'medical', label: 'Medical' },
                { key: 'progress', label: 'Progress' },
                { key: 'assessments', label: 'Assessments' },
                { key: 'history', label: 'Booking History' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? 'border-primary text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Left: main info */}
                <div className="md:col-span-2 space-y-4">

                  {/* Key Info */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key Information</h3>
                    <div className="space-y-1.5">
                      {formattedDob && (
                        <div className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                          <span className="text-muted-foreground text-xs">Date of Birth</span>
                          <span className="text-xs font-medium">{formattedDob}{age != null && ` (${age} yrs)`}</span>
                        </div>
                      )}
                      {swimmer.gender && (
                        <div className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                          <span className="text-muted-foreground text-xs">Gender</span>
                          <span className="text-xs font-medium">{formatLabel(swimmer.gender)}</span>
                        </div>
                      )}
                      {swimmer.height && (
                        <div className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                          <span className="text-muted-foreground text-xs">Height</span>
                          <span className="text-xs font-medium">{swimmer.height}</span>
                        </div>
                      )}
                      {swimmer.weight && (
                        <div className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                          <span className="text-muted-foreground text-xs">Weight</span>
                          <span className="text-xs font-medium">{swimmer.weight}</span>
                        </div>
                      )}
                      {swimmer.communication_type && (
                        <div className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                          <span className="text-muted-foreground text-xs">Communication</span>
                          <span className="text-xs font-medium">
                            {Array.isArray(swimmer.communication_type)
                              ? swimmer.communication_type.map(formatLabel).filter(Boolean).join(', ')
                              : formatLabel(swimmer.communication_type)}
                          </span>
                        </div>
                      )}
                      {swimmer.comfortable_in_water && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground text-xs">Comfort in Water</span>
                          <span className="text-xs font-medium">{formatLabel(swimmer.comfortable_in_water)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Summary (inline in Overview) */}
                  {(swimmer.diagnosis?.length || swimmer.has_allergies || swimmer.has_medical_conditions || swimmer.history_of_seizures) && (
                    <div className="border border-red-200 bg-red-50/30 rounded-lg p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2 flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" /> Medical Summary
                      </h3>
                      {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {swimmer.diagnosis.map((d, i) => (
                            <Badge key={i} className="text-xs bg-purple-100 text-purple-700 border-purple-200">{d}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1">
                        {swimmer.has_allergies && (
                          <p className="text-xs flex items-center gap-1.5 text-red-700">
                            <AlertCircle className="h-3 w-3 shrink-0" /> Allergies: {swimmer.allergies_description || 'On file'}
                          </p>
                        )}
                        {swimmer.has_medical_conditions && (
                          <p className="text-xs flex items-center gap-1.5 text-red-700">
                            <AlertCircle className="h-3 w-3 shrink-0" /> Medical conditions on file
                          </p>
                        )}
                        {swimmer.history_of_seizures && (
                          <p className="text-xs flex items-center gap-1.5 text-red-700">
                            <AlertCircle className="h-3 w-3 shrink-0" /> Seizure history
                          </p>
                        )}
                      </div>
                      <button onClick={() => setActiveTab('medical')} className="text-xs text-red-600 underline mt-2 hover:text-red-800">
                        View full medical details
                      </button>
                    </div>
                  )}

                  {/* Swim Goals */}
                  {swimmer.swim_goals && swimmer.swim_goals.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" /> Swim Goals
                      </h3>
                      <ul className="space-y-1">
                        {swimmer.swim_goals.map((goal, i) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 text-[#23a1c0] mt-0.5 shrink-0" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Emergency Contact — inline editable */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" /> Emergency Contact
                      </h3>
                      {!editingEmergency ? (
                        <button onClick={() => setEditingEmergency(true)} className="text-xs text-[#23a1c0] hover:underline flex items-center gap-1">
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setEditingEmergency(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                          <button onClick={saveEmergencyContact} disabled={emergencySaving} className="text-xs text-[#23a1c0] hover:underline font-medium disabled:opacity-50">
                            {emergencySaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingEmergency ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <input
                            className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                            value={emergencyForm.emergency_contact_name}
                            onChange={e => setEmergencyForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Relationship</label>
                          <input
                            className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                            value={emergencyForm.emergency_contact_relationship}
                            onChange={e => setEmergencyForm(f => ({ ...f, emergency_contact_relationship: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Phone</label>
                          <input
                            type="tel"
                            className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                            value={emergencyForm.emergency_contact_phone}
                            onChange={e => setEmergencyForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(emergencyForm.emergency_contact_name || swimmer.emergency_contact_name) ? (
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="text-xs text-muted-foreground">Name</span>
                            <span className="text-xs font-medium">{emergencyForm.emergency_contact_name || swimmer.emergency_contact_name}</span>
                          </div>
                        ) : null}
                        {(emergencyForm.emergency_contact_relationship || swimmer.emergency_contact_relationship) ? (
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="text-xs text-muted-foreground">Relationship</span>
                            <span className="text-xs font-medium">{emergencyForm.emergency_contact_relationship || swimmer.emergency_contact_relationship}</span>
                          </div>
                        ) : null}
                        {(emergencyForm.emergency_contact_phone || swimmer.emergency_contact_phone) ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Phone</span>
                            <a href={`tel:${emergencyForm.emergency_contact_phone || swimmer.emergency_contact_phone}`} className="text-xs text-blue-600 hover:underline font-medium">
                              {emergencyForm.emergency_contact_phone || swimmer.emergency_contact_phone}
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No emergency contact on file. Click Edit to add one.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Funding details */}
                  {hasFundingDetails && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> Funding
                      </h3>
                      <div className="space-y-1.5">
                        {swimmer.funding_source_name && (
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="text-xs text-muted-foreground">Source</span>
                            <span className="text-xs font-medium">{swimmer.funding_source_name}</span>
                          </div>
                        )}
                        {swimmer.authorized_sessions_total != null && (
                          <div className="space-y-1 border-b border-border/40 pb-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Sessions</span>
                              <span className="text-xs font-semibold text-violet-700">
                                {swimmer.authorized_sessions_used ?? 0} / {swimmer.authorized_sessions_total} used
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-violet-500 transition-all"
                                style={{ width: `${Math.min(100, ((swimmer.authorized_sessions_used ?? 0) / swimmer.authorized_sessions_total) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Coordinator — inline editable */}
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Coordinator</span>
                          {!editingCoordinator ? (
                            <button onClick={() => setEditingCoordinator(true)} className="text-xs text-[#23a1c0] hover:underline flex items-center gap-1">
                              <Edit className="h-3 w-3" /> Edit
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => setEditingCoordinator(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                              <button onClick={saveCoordinator} disabled={coordinatorSaving} className="text-xs text-[#23a1c0] hover:underline font-medium disabled:opacity-50">
                                {coordinatorSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCoordinator ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Name</label>
                              <input
                                className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                                value={coordinatorForm.funding_coordinator_name}
                                onChange={e => setCoordinatorForm(f => ({ ...f, funding_coordinator_name: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Email</label>
                              <input
                                type="email"
                                className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                                value={coordinatorForm.funding_coordinator_email}
                                onChange={e => setCoordinatorForm(f => ({ ...f, funding_coordinator_email: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Phone</label>
                              <input
                                type="tel"
                                className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded-md bg-background"
                                value={coordinatorForm.funding_coordinator_phone}
                                onChange={e => setCoordinatorForm(f => ({ ...f, funding_coordinator_phone: e.target.value }))}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {coordinatorForm.funding_coordinator_name && (
                              <p className="text-xs font-medium">{coordinatorForm.funding_coordinator_name}</p>
                            )}
                            {coordinatorForm.funding_coordinator_email && (
                              <a href={`mailto:${coordinatorForm.funding_coordinator_email}`} className="text-xs text-blue-600 hover:underline block">
                                {coordinatorForm.funding_coordinator_email}
                              </a>
                            )}
                            {coordinatorForm.funding_coordinator_phone && (
                              <a href={`tel:${coordinatorForm.funding_coordinator_phone}`} className="text-xs text-blue-600 hover:underline block">
                                {coordinatorForm.funding_coordinator_phone}
                              </a>
                            )}
                            {!coordinatorForm.funding_coordinator_name && !coordinatorForm.funding_coordinator_email && (
                              <p className="text-xs text-muted-foreground italic">No coordinator on file. Click Edit to add one.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PO / Authorization alert */}
                  {swimmer.funding_source_requires_authorization && swimmer.active_purchase_order && (
                    <div className="border border-violet-200 bg-violet-50/40 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide">Authorization Summary</p>
                      <p className="text-sm font-medium text-violet-900">
                        {swimmer.active_purchase_order.sessions_remaining} of {swimmer.active_purchase_order.sessions_authorized} lessons remaining
                      </p>
                      {swimmer.active_purchase_order.unexcused_late_cancel_count >= 1 && (
                        <p className="text-xs text-amber-700">
                          {swimmer.active_purchase_order.unexcused_late_cancel_count} late cancel(s) — may affect program eligibility
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-3 md:sticky md:top-0 md:self-start">

                  {/* Quick Stats */}
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Stats</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-xs text-muted-foreground">Level</span>
                        <span className="text-xs font-medium">{swimmer.current_level?.display_name ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-xs text-muted-foreground">Lessons</span>
                        <span className="text-xs font-medium">{swimmer.lessons_completed ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-xs text-muted-foreground">Skills Mastered</span>
                        <span className="text-xs font-medium">{masteredSkills.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">In Progress</span>
                        <span className="text-xs font-medium">{inProgressSkills.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Session */}
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Next Session
                    </h3>
                    {nextSessionDisplay ? (
                      <p className="text-sm font-medium text-green-700">{nextSessionDisplay}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No upcoming sessions</p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Actions</h3>
                    <Button size="sm" className="w-full h-8 text-xs bg-[#23a1c0] hover:bg-[#1d8ba6] text-white" asChild>
                      <Link href={`/parent/book?swimmer=${swimmer.id}`}>
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Book a Session
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs" asChild>
                      <Link href={`/parent/swimmers/${swimmer.id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Info
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs" asChild>
                      <Link href={`/parent/swimmers/${swimmer.id}/progress`}>
                        <Activity className="h-3.5 w-3.5 mr-1.5" /> Full Progress
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MEDICAL TAB ── */}
            {activeTab === 'medical' && (
              <div className="max-w-2xl space-y-4">
                {/* Diagnosis */}
                {swimmer.diagnosis && swimmer.diagnosis.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Diagnosis</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {swimmer.diagnosis.map((d, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Alerts */}
                {(swimmer.has_allergies || swimmer.has_medical_conditions || swimmer.history_of_seizures) && (
                  <div className="border border-red-200 bg-red-50/40 rounded-lg p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Medical Alerts
                    </h3>
                    <div className="space-y-2.5">
                      {swimmer.has_allergies && (
                        <div>
                          <p className="text-xs font-medium flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Allergies</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{swimmer.allergies_description || 'Reported'}</p>
                        </div>
                      )}
                      {swimmer.has_medical_conditions && (
                        <div>
                          <p className="text-xs font-medium flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> Medical Conditions</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{swimmer.medical_conditions_description || 'Reported'}</p>
                        </div>
                      )}
                      {swimmer.history_of_seizures && (
                        <div>
                          <p className="text-xs font-medium flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Seizure History</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{swimmer.seizures_description || 'Reported'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Physical */}
                {(swimmer.toilet_trained || swimmer.non_ambulatory !== undefined) && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Physical</h3>
                    <div className="space-y-1.5">
                      {swimmer.toilet_trained && (
                        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                          <span className="text-xs text-muted-foreground">Toilet Trained</span>
                          <span className="text-xs font-medium">{formatLabel(swimmer.toilet_trained)}</span>
                        </div>
                      )}
                      {swimmer.non_ambulatory !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Non-Ambulatory</span>
                          <span className="text-xs font-medium">{formatYesNo(swimmer.non_ambulatory)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!hasMedicalDetails && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No medical information on file.</div>
                )}
              </div>
            )}

            {/* ── PROGRESS TAB ── */}
            {activeTab === 'progress' && (
              <div className="space-y-4">
                {/* Summary tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{swimmer.lessons_completed ?? 0}</div>
                    <div className="text-xs text-blue-700 mt-0.5">Lessons</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{masteredSkills.length}</div>
                    <div className="text-xs text-emerald-700 mt-0.5">Mastered</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">{inProgressSkills.length}</div>
                    <div className="text-xs text-amber-700 mt-0.5">In Progress</div>
                  </div>
                </div>

                {skillsLoading && (
                  <div className="text-center py-6 text-sm text-muted-foreground animate-pulse">Loading skills...</div>
                )}

                {!skillsLoading && skills.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No skill data available yet.</div>
                )}

                {/* Skills by level */}
                {!skillsLoading && skills.length > 0 && Object.entries(skillsByLevel).map(([levelName, levelSkills]) => {
                  const mastered = levelSkills.filter(s => s.status === 'mastered')
                  const inProg = levelSkills.filter(s => s.status === 'in_progress')
                  const notStarted = levelSkills.filter(s => s.status === 'not_started')
                  const pct = Math.round((mastered.length / levelSkills.length) * 100)

                  return (
                    <div key={levelName} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold">{levelName}</h3>
                        <span className="text-xs text-muted-foreground">{mastered.length}/{levelSkills.length} mastered</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                        <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>

                      {/* Mastered */}
                      {mastered.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-emerald-700 mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
                          </p>
                          <div className="space-y-1">
                            {mastered.map(skill => (
                              <div key={skill.id} className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>{skill.name}</span>
                                {skill.date_mastered && (
                                  <span className="text-muted-foreground ml-auto">{new Date(skill.date_mastered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* In Progress */}
                      {inProg.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> In Progress
                          </p>
                          <div className="space-y-1">
                            {inProg.map(skill => (
                              <div key={skill.id} className="flex items-center gap-2 text-xs">
                                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span>{skill.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Not started — only show if there are some mastered already */}
                      {notStarted.length > 0 && mastered.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Circle className="h-3.5 w-3.5" /> Not Yet Started
                          </p>
                          <div className="space-y-1">
                            {notStarted.map(skill => (
                              <div key={skill.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Circle className="h-3.5 w-3.5 shrink-0" />
                                <span>{skill.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ASSESSMENTS TAB ── */}
            {activeTab === 'assessments' && (
              <div className="space-y-4">
                {assessmentsLoading && (
                  <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading assessments...</div>
                )}
                {!assessmentsLoading && assessments.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No assessment reports on file.</p>
                  </div>
                )}
                {!assessmentsLoading && assessments.map((a) => {
                  const sessionDate = a.session?.start_time
                    ? new Date(a.session.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : a.completed_at
                      ? new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : null
                  const statusColor = a.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : a.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-muted text-muted-foreground'
                  return (
                    <div key={a.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{sessionDate ?? 'Date unknown'}</span>
                          {a.session?.location && (
                            <span className="text-xs text-muted-foreground">· {a.session.location}</span>
                          )}
                        </div>
                        <Badge className={`text-xs px-1.5 py-0 h-4 capitalize ${statusColor}`}>{a.status}</Badge>
                      </div>
                      {a.session?.instructor && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {(a.session.instructor as any).full_name}
                        </p>
                      )}
                      {a.recommended_level && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Recommended Level:</span>
                          <span className="text-xs font-semibold text-[#23a1c0]">{a.recommended_level}</span>
                        </div>
                      )}
                      {a.comfort_in_water && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Water Comfort:</span>
                          <span className="text-xs font-medium">{formatLabel(a.comfort_in_water)}</span>
                        </div>
                      )}
                      {a.notes && (
                        <div className="border-t border-border/40 pt-2 mt-1">
                          <p className="text-xs text-muted-foreground italic">{a.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── BOOKING HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div className="space-y-2">
                {bookingsLoading && (
                  <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading booking history...</div>
                )}
                {!bookingsLoading && bookings.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No booking history found.</p>
                  </div>
                )}
                {!bookingsLoading && bookings.map((b) => {
                  const sessionDate = b.session?.start_time
                    ? new Date(b.session.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : null
                  const sessionTime = b.session?.start_time
                    ? new Date(b.session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : null
                  const statusMap: Record<string, string> = {
                    confirmed: 'bg-emerald-100 text-emerald-700',
                    completed: 'bg-blue-100 text-blue-700',
                    cancelled: 'bg-red-100 text-red-700',
                    pending: 'bg-amber-100 text-amber-700',
                    late_cancel: 'bg-orange-100 text-orange-700',
                  }
                  const statusColor = statusMap[b.status] ?? 'bg-muted text-muted-foreground'
                  return (
                    <div key={b.id} className="bg-muted/30 rounded-lg p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{sessionDate ?? 'Date unknown'}{sessionTime ? ` · ${sessionTime}` : ''}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {b.session?.location && (
                            <span className="text-xs text-muted-foreground">{b.session.location}</span>
                          )}
                          {b.session?.instructor && (
                            <span className="text-xs text-muted-foreground">· {(b.session.instructor as any).full_name}</span>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs px-1.5 py-0 h-4 capitalize shrink-0 ${statusColor}`}>
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
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
