'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare, Plus, Calendar, User, Award, Smile, Droplets, Share2, CheckCircle, Clock, XCircle } from 'lucide-react'
import AddNoteModal from '../modals/AddNoteModal'

interface ProgressNote {
  id: string
  created_at: string
  lesson_date: string
  lesson_summary: string
  attendance_status: 'present' | 'absent' | 'late'
  swimmer_mood: 'happy' | 'neutral' | 'frustrated' | 'tired' | null
  water_comfort: 'comfortable' | 'cautious' | 'anxious' | null
  skills_working_on: string[]
  skills_mastered: string[]
  instructor_notes: string | null
  parent_notes: string | null
  shared_with_parent: boolean
  instructor_id: string
  instructor_name: string | null
  skill_names_working_on: string[]
  skill_names_mastered: string[]
}

interface NotesTabProps {
  swimmerId: string
  instructorId: any
}

async function fetchProgressNotes(swimmerId: string): Promise<ProgressNote[]> {
  const supabase = createClient()

  try {
    // Fetch progress notes with instructor info
    const { data: notes, error: notesError } = await supabase
      .from('progress_notes')
      .select(`
        *,
        profiles!progress_notes_instructor_id_fkey (
          full_name
        )
      `)
      .eq('swimmer_id', swimmerId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Error fetching progress notes:', notesError)
      throw new Error('Failed to fetch progress notes')
    }

    if (!notes || notes.length === 0) {
      return []
    }

    // Get all skill IDs from notes
    const allSkillIds = new Set<string>()
    notes.forEach(note => {
      note.skills_working_on?.forEach(id => allSkillIds.add(id))
      note.skills_mastered?.forEach(id => allSkillIds.add(id))
    })

    // Fetch skill names if there are any skills
    let skillNamesMap = new Map<string, string>()
    if (allSkillIds.size > 0) {
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name')
        .in('id', Array.from(allSkillIds))

      if (!skillsError && skills) {
        skillNamesMap = new Map(skills.map(skill => [skill.id, skill.name]))
      }
    }

    // Transform the data
    const transformedNotes: ProgressNote[] = notes.map(note => ({
      id: note.id,
      created_at: note.created_at,
      lesson_date: note.lesson_date,
      lesson_summary: note.lesson_summary,
      attendance_status: note.attendance_status,
      swimmer_mood: note.swimmer_mood,
      water_comfort: note.water_comfort,
      skills_working_on: note.skills_working_on || [],
      skills_mastered: note.skills_mastered || [],
      instructor_notes: note.instructor_notes,
      parent_notes: note.parent_notes,
      shared_with_parent: note.shared_with_parent,
      instructor_id: note.instructor_id,
      instructor_name: note.profiles?.full_name || null,
      skill_names_working_on: (note.skills_working_on || []).map(id => skillNamesMap.get(id) || `Skill ${id}`),
      skill_names_mastered: (note.skills_mastered || []).map(id => skillNamesMap.get(id) || `Skill ${id}`)
    }))

    return transformedNotes

  } catch (error) {
    console.error('Error in fetchProgressNotes:', error)
    throw error
  }
}

export default function NotesTab({
  swimmerId,
  instructorId
}: NotesTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['progressNotes', swimmerId],
    queryFn: () => fetchProgressNotes(swimmerId),
    enabled: !!swimmerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const formatNoteDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return format(date, 'MMM d')
    } catch {
      return dateString
    }
  }

  const getAttendanceBadge = (status: ProgressNote['attendance_status']) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        )
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        )
      case 'late':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        )
    }
  }

  const getMoodIcon = (mood: ProgressNote['swimmer_mood']) => {
    switch (mood) {
      case 'happy':
        return <Smile className="h-4 w-4 text-green-500" />
      case 'neutral':
        return <Smile className="h-4 w-4 text-gray-400" />
      case 'frustrated':
        return <Smile className="h-4 w-4 text-amber-500" />
      case 'tired':
        return <Smile className="h-4 w-4 text-blue-400" />
      default:
        return null
    }
  }

  const getWaterComfortIcon = (comfort: ProgressNote['water_comfort']) => {
    switch (comfort) {
      case 'comfortable':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'cautious':
        return <Droplets className="h-4 w-4 text-amber-500" />
      case 'anxious':
        return <Droplets className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#2a5e84]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading notes</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch progress notes'}
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#e8f4f8] rounded-lg">
                <MessageSquare className="h-8 w-8 text-[#2a5e84]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">📝 Lesson Notes</h3>
                <p className="text-gray-600">Chronological record of swimmer progress</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#2a5e84]">{notes?.length || 0}</div>
                <p className="text-sm text-gray-600">Total notes</p>
              </div>
              <Button
                size="lg"
                className="bg-[#2a5e84] hover:bg-[#1e4565]"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {notes && notes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">
                    {notes.filter(n => n.attendance_status === 'present').length} present
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#2a5e84]" />
                  <span className="text-sm text-gray-700">
                    {notes.reduce((acc, note) => acc + note.skills_mastered.length, 0)} skills mastered
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-700">
                    {notes.filter(n => n.shared_with_parent).length} shared with parents
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes List */}
      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map(note => (
            <Card key={note.id} className="border-gray-200 hover:border-[#6abedc] transition-colors">
              <CardContent className="pt-6">
                {/* Note Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {formatNoteDate(note.lesson_date)}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{note.instructor_name || 'Instructor'}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getAttendanceBadge(note.attendance_status)}
                    {note.shared_with_parent && (
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Lesson Summary */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Lesson Summary</h5>
                  <p className="text-gray-700 whitespace-pre-line">{note.lesson_summary}</p>
                </div>

                {/* Mood and Water Comfort */}
                {(note.swimmer_mood || note.water_comfort) && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {note.swimmer_mood && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getMoodIcon(note.swimmer_mood)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">Swimmer Mood</p>
                          <p className="text-sm text-gray-600 capitalize">{note.swimmer_mood}</p>
                        </div>
                      </div>
                    )}
                    {note.water_comfort && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getWaterComfortIcon(note.water_comfort)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">Water Comfort</p>
                          <p className="text-sm text-gray-600 capitalize">{note.water_comfort}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Skills Worked On */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Skills Worked On</h5>
                    {note.skill_names_working_on.length > 0 ? (
                      <div className="space-y-2">
                        {note.skill_names_working_on.map((skillName, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#2a5e84]"></div>
                            <span className="text-sm text-gray-700">{skillName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No specific skills recorded</p>
                    )}
                  </div>

                  {/* Skills Mastered */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Skills Mastered This Lesson</h5>
                    {note.skill_names_mastered.length > 0 ? (
                      <div className="space-y-2">
                        {note.skill_names_mastered.map((skillName, index) => (
                          <Badge
                            key={index}
                            className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {skillName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No skills mastered this lesson</p>
                    )}
                  </div>
                </div>

                {/* Notes Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instructor Notes */}
                  {note.instructor_notes && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Instructor Notes</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{note.instructor_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Parent Notes (if shared) */}
                  {note.shared_with_parent && note.parent_notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">Parent Notes</h5>
                        <Share2 className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{note.parent_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No notes yet</h3>
              <p className="text-gray-500 mt-2">
                Start documenting swimmer progress by adding your first lesson note.
              </p>
              <Button
                size="lg"
                className="mt-6 bg-[#2a5e84] hover:bg-[#1e4565]"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Note Modal */}
      <AddNoteModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        swimmerId={swimmerId}
        instructorId={instructorId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['progressNotes', swimmerId] })
          queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
        }}
      />

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>Lesson notes help track progress and communicate with parents. Add notes after each session.</p>
        <p className="mt-1">Notes marked as "Shared with parent" will be visible to the swimmer's family.</p>
      </div>
    </div>
  )
}