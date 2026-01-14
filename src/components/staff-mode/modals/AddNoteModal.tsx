'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, MessageSquare, Smile, Droplets, Share2, Award } from 'lucide-react'

interface Skill {
  id: string
  name: string
  level_name: string
}

interface AddNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimmerId: string
  instructorId: string
  onSuccess?: () => void
}

async function fetchAvailableSkills(): Promise<Skill[]> {
  const supabase = createClient()

  try {
    const { data: skills, error } = await supabase
      .from('skills')
      .select(`
        id,
        name,
        swim_levels!inner (
          name
        )
      `)
      .order('level_id')
      .order('name')

    if (error) {
      console.error('Error fetching skills:', error)
      throw new Error('Failed to fetch available skills')
    }

    return skills?.map(skill => ({
      id: skill.id,
      name: skill.name,
      level_name: skill.swim_levels?.name || 'Unknown'
    })) || []
  } catch (error) {
    console.error('Error in fetchAvailableSkills:', error)
    throw error
  }
}

async function createProgressNote(
  swimmerId: string,
  instructorId: string,
  data: {
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
  }
) {
  const supabase = createClient()

  try {
    const now = new Date().toISOString()

    // Create the progress note
    const { data: note, error: noteError } = await supabase
      .from('progress_notes')
      .insert({
        swimmer_id: swimmerId,
        instructor_id: instructorId,
        ...data,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (noteError) {
      console.error('Error creating progress note:', noteError)
      throw new Error('Failed to create progress note')
    }

    // Update swimmer_skills for any mastered skills
    if (data.skills_mastered.length > 0) {
      for (const skillId of data.skills_mastered) {
        const { error: skillError } = await supabase
          .from('swimmer_skills')
          .upsert({
            swimmer_id: swimmerId,
            skill_id: skillId,
            status: 'mastered',
            mastered_date: now,
            updated_by: instructorId,
            updated_at: now,
            created_at: now
          }, {
            onConflict: 'swimmer_id,skill_id'
          })

        if (skillError) {
          console.error('Error updating mastered skill:', skillError)
          // Continue even if skill update fails
        }
      }
    }

    return note
  } catch (error) {
    console.error('Error in createProgressNote:', error)
    throw error
  }
}

export default function AddNoteModal({
  open,
  onOpenChange,
  swimmerId,
  instructorId,
  onSuccess
}: AddNoteModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [lessonDate, setLessonDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [lessonSummary, setLessonSummary] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present')
  const [swimmerMood, setSwimmerMood] = useState<'happy' | 'neutral' | 'frustrated' | 'tired' | ''>('')
  const [waterComfort, setWaterComfort] = useState<'comfortable' | 'cautious' | 'anxious' | ''>('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [masteredSkills, setMasteredSkills] = useState<string[]>([])
  const [instructorNotes, setInstructorNotes] = useState('')
  const [parentNotes, setParentNotes] = useState('')
  const [sharedWithParent, setSharedWithParent] = useState(false)

  // Fetch available skills
  const { data: availableSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['availableSkills'],
    queryFn: fetchAvailableSkills,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: () => createProgressNote(swimmerId, instructorId, {
      lesson_date: lessonDate,
      lesson_summary: lessonSummary,
      attendance_status: attendanceStatus,
      swimmer_mood: swimmerMood || null,
      water_comfort: waterComfort || null,
      skills_working_on: selectedSkills,
      skills_mastered: masteredSkills,
      instructor_notes: instructorNotes || null,
      parent_notes: parentNotes || null,
      shared_with_parent: sharedWithParent
    }),
    onSuccess: () => {
      toast({
        title: 'Note created',
        description: 'Lesson note has been saved successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['progressNotes', swimmerId] })
      queryClient.invalidateQueries({ queryKey: ['swimmerSkills', swimmerId] })
      onSuccess?.()
      resetForm()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create note',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const resetForm = () => {
    setLessonDate(format(new Date(), 'yyyy-MM-dd'))
    setLessonSummary('')
    setAttendanceStatus('present')
    setSwimmerMood('')
    setWaterComfort('')
    setSelectedSkills([])
    setMasteredSkills([])
    setInstructorNotes('')
    setParentNotes('')
    setSharedWithParent(false)
  }

  const handleSubmit = () => {
    if (!lessonSummary.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Lesson summary is required.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    createMutation.mutate()
  }

  const handleSkillToggle = (skillId: string) => {
    const newSelected = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId]

    setSelectedSkills(newSelected)

    // Remove from mastered if deselected
    if (!newSelected.includes(skillId)) {
      setMasteredSkills(masteredSkills.filter(id => id !== skillId))
    }
  }

  const handleMasteredToggle = (skillId: string) => {
    setMasteredSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const getSkillName = (skillId: string) => {
    return availableSkills?.find(s => s.id === skillId)?.name || skillId
  }

  const getSkillLevel = (skillId: string) => {
    return availableSkills?.find(s => s.id === skillId)?.level_name || 'Unknown'
  }

  // Group skills by level
  const skillsByLevel = availableSkills?.reduce((acc, skill) => {
    const level = skill.level_name
    if (!acc[level]) acc[level] = []
    acc[level].push(skill)
    return acc
  }, {} as Record<string, Skill[]>) || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#2a5e84]" />
            Add Lesson Note
          </DialogTitle>
          <DialogDescription>
            Document today's lesson and track swimmer progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lesson Date */}
          <div className="space-y-3">
            <Label htmlFor="lessonDate">Lesson Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="lessonDate"
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Attendance Status */}
          <div className="space-y-3">
            <Label>Attendance</Label>
            <Select value={attendanceStatus} onValueChange={(value: 'present' | 'absent' | 'late') => setAttendanceStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select attendance status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Present</span>
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span>Absent</span>
                  </div>
                </SelectItem>
                <SelectItem value="late">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <span>Late</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Summary */}
          <div className="space-y-3">
            <Label htmlFor="lessonSummary">Lesson Summary *</Label>
            <Textarea
              id="lessonSummary"
              placeholder="Describe today's lesson, progress made, challenges faced, and overall observations..."
              value={lessonSummary}
              onChange={(e) => setLessonSummary(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
            <p className="text-sm text-gray-500">
              Required. This will be the main description of the lesson.
            </p>
          </div>

          {/* Mood and Water Comfort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Swimmer Mood (Optional)
              </Label>
              <Select value={swimmerMood} onValueChange={(value: 'happy' | 'neutral' | 'frustrated' | 'tired' | '') => setSwimmerMood(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="happy">Happy</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="frustrated">Frustrated</SelectItem>
                  <SelectItem value="tired">Tired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Water Comfort (Optional)
              </Label>
              <Select value={waterComfort} onValueChange={(value: 'comfortable' | 'cautious' | 'anxious' | '') => setWaterComfort(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comfort level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="cautious">Cautious</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Skills Worked On
              </Label>
              <span className="text-sm text-gray-500">
                {selectedSkills.length} selected
              </span>
            </div>

            {isLoadingSkills ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#2a5e84]" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(skillsByLevel).map(([levelName, skills]) => (
                  <div key={levelName} className="space-y-3">
                    <h4 className="font-medium text-gray-900">{levelName} Level</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {skills.map(skill => {
                        const isSelected = selectedSkills.includes(skill.id)
                        const isMastered = masteredSkills.includes(skill.id)

                        return (
                          <div
                            key={skill.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-[#2a5e84] bg-[#e8f4f8]'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSkillToggle(skill.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleSkillToggle(skill.id)}
                                  className="h-5 w-5"
                                />
                                <span className="font-medium text-gray-900">{skill.name}</span>
                              </div>
                              {isMastered && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                  Mastered
                                </Badge>
                              )}
                            </div>

                            {isSelected && (
                              <div className="mt-3 pl-8">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`mastered-${skill.id}`}
                                    checked={isMastered}
                                    onCheckedChange={() => handleMasteredToggle(skill.id)}
                                    className="h-4 w-4"
                                  />
                                  <Label
                                    htmlFor={`mastered-${skill.id}`}
                                    className="text-sm text-gray-600 cursor-pointer"
                                  >
                                    Mark as mastered this lesson
                                  </Label>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="instructorNotes">Instructor Notes (Private)</Label>
              <Textarea
                id="instructorNotes"
                placeholder="Private notes for instructors only..."
                value={instructorNotes}
                onChange={(e) => setInstructorNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="parentNotes" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Parent Notes (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="shareWithParent"
                    checked={sharedWithParent}
                    onCheckedChange={(checked) => setSharedWithParent(checked as boolean)}
                  />
                  <Label htmlFor="shareWithParent" className="text-sm cursor-pointer">
                    Share with parent
                  </Label>
                </div>
              </div>
              <Textarea
                id="parentNotes"
                placeholder="Notes to share with swimmer's family..."
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                rows={3}
                disabled={!sharedWithParent}
              />
              {sharedWithParent && (
                <p className="text-sm text-gray-500">
                  These notes will be visible to the swimmer's parents.
                </p>
              )}
            </div>
          </div>

          {/* Summary of Mastered Skills */}
          {masteredSkills.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Skills to Mark as Mastered</h4>
              </div>
              <div className="space-y-2">
                {masteredSkills.map(skillId => (
                  <div key={skillId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-700">{getSkillName(skillId)}</p>
                      <p className="text-sm text-green-600">{getSkillLevel(skillId)} Level</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Will be updated
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-600 mt-3">
                These skills will be automatically marked as mastered in the swimmer's skill tracking.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#2a5e84] hover:bg-[#1e4565]"
            onClick={handleSubmit}
            disabled={isSubmitting || !lessonSummary.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Lesson Note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}