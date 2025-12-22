'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Activity, CheckCircle, Circle, Clock, AlertCircle, FileText, Award } from 'lucide-react'
import { format } from 'date-fns'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  current_level?: {
    id: string
    name: string
    display_name: string
    color?: string
  }
}

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

interface ProgressNote {
  id: string
  lesson_summary: string
  parent_notes?: string
  skills_working_on: string[]
  skills_mastered: string[]
  created_at: string
  instructor: {
    full_name?: string
  }
  session?: {
    start_time: string
    location: string
  }
}

export default function SwimmerProgressPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const swimmerId = params.id as string

  const fetchSwimmerProgress = useCallback(async () => {
    if (!user || !swimmerId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch swimmer details with authorization check
      const { data: swimmerData, error: swimmerError } = await supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          current_level:swim_levels(id, name, display_name, color)
        `)
        .eq('id', swimmerId)
        .eq('parent_id', user.id)
        .maybeSingle()

      if (swimmerError) {
        console.error('Swimmer query error:', swimmerError)
        throw swimmerError
      }

      if (!swimmerData) {
        console.error('No swimmer found with ID:', swimmerId, 'for user:', user.id)
        router.push('/parent/swimmers')
        return
      }

      setSwimmer(swimmerData)

      // Fetch swimmer skills with skill details
      // BUSINESS RULE: swimmer_skills.instructor_notes is internal only - do not show to parents
      const { data: skillsData, error: skillsError } = await supabase
        .from('swimmer_skills')
        .select(`
          id,
          status,
          date_mastered,
          skill:skills(
            id,
            name,
            description,
            sequence,
            level:swim_levels(id, name, display_name, color)
          )
        `)
        .eq('swimmer_id', swimmerId)
        .order('skill.level.sequence', { ascending: true })
        .order('skill.sequence', { ascending: true })

      if (skillsError) {
        console.error('Skills query error:', skillsError)
        throw skillsError
      }

      // Transform skills data
      const transformedSkills = (skillsData || []).map((item: any) => ({
        id: item.skill.id,
        name: item.skill.name,
        description: item.skill.description,
        sequence: item.skill.sequence,
        level: item.skill.level,
        status: item.status,
        date_mastered: item.date_mastered
      }))
      setSkills(transformedSkills)

      // Fetch progress notes
      // BUSINESS RULE: instructor_notes is internal only - do not show to parents
      const { data: notesData, error: notesError } = await supabase
        .from('progress_notes')
        .select(`
          id,
          lesson_summary,
          parent_notes,
          skills_working_on,
          skills_mastered,
          created_at,
          instructor:profiles(full_name),
          session:sessions(start_time, location)
        `)
        .eq('swimmer_id', swimmerId)
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Progress notes query error:', notesError)
        throw notesError
      }

      setProgressNotes(notesData || [])
    } catch (err: any) {
      console.error('Error fetching swimmer progress:', err)
      setError(err.message || 'Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }, [user, swimmerId, router, supabase])

  useEffect(() => {
    fetchSwimmerProgress()
  }, [fetchSwimmerProgress])

  // Calculate progress statistics
  const masteredSkills = skills.filter(skill => skill.status === 'mastered').length
  const inProgressSkills = skills.filter(skill => skill.status === 'in_progress').length
  const totalSkills = skills.length
  const masteryPercentage = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0

  // Group skills by level
  const skillsByLevel = skills.reduce((acc, skill) => {
    const levelId = skill.level.id
    if (!acc[levelId]) {
      acc[levelId] = {
        level: skill.level,
        skills: []
      }
    }
    acc[levelId].skills.push(skill)
    return acc
  }, {} as Record<string, { level: any; skills: Skill[] }>)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-300" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'Mastered'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Not Started'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href={`/parent/swimmers/${swimmerId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Swimmer Profile
          </Link>
        </Button>
      </div>
    )
  }

  if (!swimmer) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href={`/parent/swimmers/${swimmerId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Swimmer Profile
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Progress Tracking: {swimmer.first_name} {swimmer.last_name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Track skill development and view progress notes from instructors
            </p>
          </div>

          {swimmer.current_level && (
            <Badge
              className="px-4 py-2 text-lg"
              style={{
                backgroundColor: swimmer.current_level.color || 'var(--primary)',
                color: 'white'
              }}
            >
              <Award className="h-4 w-4 mr-2" />
              {swimmer.current_level.display_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{masteredSkills}</div>
              <div className="text-sm text-muted-foreground">Skills Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600">{inProgressSkills}</div>
              <div className="text-sm text-muted-foreground">Skills In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{totalSkills}</div>
              <div className="text-sm text-muted-foreground">Total Skills</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Mastery</span>
              <span className="font-medium">{masteryPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList>
          <TabsTrigger value="skills">Skills Tracking</TabsTrigger>
          <TabsTrigger value="notes">Progress Notes</TabsTrigger>
        </TabsList>

        {/* Skills Tracking Tab */}
        <TabsContent value="skills" className="space-y-6">
          {Object.entries(skillsByLevel).map(([levelId, { level, skills: levelSkills }]) => (
            <Card key={levelId}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div
                    className="h-4 w-4 rounded-full mr-2"
                    style={{ backgroundColor: level.color || 'var(--primary)' }}
                  />
                  {level.display_name} Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {levelSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(skill.status)}
                        <div>
                          <div className="font-medium">{skill.name}</div>
                          {skill.description && (
                            <div className="text-sm text-muted-foreground">{skill.description}</div>
                          )}
                          {skill.date_mastered && (
                            <div className="text-xs text-green-600 mt-1">
                              Mastered on {format(new Date(skill.date_mastered), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(skill.status)}>
                        {getStatusText(skill.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {skills.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Skills Tracked Yet</h3>
                <p className="text-muted-foreground">
                  Skills tracking will begin after the first lesson. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          {progressNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Progress Note
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(note.created_at), 'MMMM d, yyyy')}
                      {note.session && ` • ${note.session.location}`}
                      {note.instructor?.full_name && ` • Instructor: ${note.instructor.full_name}`}
                    </div>
                  </div>
                  {note.skills_mastered.length > 0 && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {note.skills_mastered.length} skill{note.skills_mastered.length !== 1 ? 's' : ''} mastered
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.lesson_summary && (
                  <div>
                    <h4 className="font-medium mb-2">Lesson Summary</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{note.lesson_summary}</p>
                  </div>
                )}

                {note.parent_notes && (
                  <div>
                    <h4 className="font-medium mb-2">Your Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{note.parent_notes}</p>
                  </div>
                )}

                {(note.skills_working_on.length > 0 || note.skills_mastered.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {note.skills_working_on.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Skills Working On</h4>
                        <div className="space-y-1">
                          {note.skills_working_on.map((skillId, index) => (
                            <div key={index} className="flex items-center">
                              <Clock className="h-3 w-3 text-yellow-600 mr-2" />
                              <span className="text-sm">Skill {skillId.substring(0, 8)}...</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {note.skills_mastered.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Skills Mastered</h4>
                        <div className="space-y-1">
                          {note.skills_mastered.map((skillId, index) => (
                            <div key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                              <span className="text-sm">Skill {skillId.substring(0, 8)}...</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {progressNotes.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Progress Notes Yet</h3>
                <p className="text-muted-foreground">
                  Progress notes will appear here after each lesson. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}