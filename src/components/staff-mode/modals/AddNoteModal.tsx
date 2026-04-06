'use client'

import { useState } from 'react'
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
  instructorId: any
  currentLevelId?: string
  onSuccess?: () => void
}

async function fetchCurrentLevelSkills(currentLevelId?: string): Promise<Skill[]> {
  const supabase = createClient()

  try {
    if (!currentLevelId) {
      return []
    }

    const { data: skills, error } = await supabase
      .from('skills')
      .select(`
        id,
        name
      `)
      .eq('level_id', currentLevelId)
      .order('name')

    if (error) {
      console.error('Error fetching skills:', error)
      throw new Error('Failed to fetch skills for current level')
    }

    return skills?.map(skill => ({
      id: skill.id,
      name: skill.name,
      level_name: '' // Not needed for current level skills
    })) || []
  } catch (error) {
    console.error('Error in fetchCurrentLevelSkills:', error)
    throw error
  }
}

async function createProgressNote(
  swimmerId: string,
  instructorId: any,
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

    // Normalize instructorId - could be string or object with id property
    const normalizeInstructorId = (id: any): string | null => {
      if (typeof id === 'string') return id || null;
      if (id && typeof id === 'object' && 'id' in id) {
        return typeof id.id === 'string' ? id.id : null;
      }
      return null;
    };
    const normalizedInstructorId = normalizeInstructorId(instructorId);

    // Create the progress note
    const { data: note, error: noteError } = await supabase
      .from('progress_notes')
      .insert({
        swimmer_id: swimmerId,
        instructor_id: normalizedInstructorId,
        updated_by: normalizedInstructorId,
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
            date_mastered: now.split('T')[0], // Store date only
            updated_at: now,
            updated_by: normalizedInstructorId,
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
  currentLevelId,
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

  // Fetch skills for current level
  const { data: currentLevelSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['currentLevelSkills', currentLevelId],
    queryFn: () => fetchCurrentLevelSkills(currentLevelId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!currentLevelId,
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
    return currentLevelSkills?.find(s => s.id === skillId)?.name || skillId
  }

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

          {/* Skills Selection - Current Level Only */}
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Skills worked on today
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                (optional — only shows your current level)
              </p>
            </div>

            {isLoadingSkills ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#2a5e84]" />
              </div>
            ) : currentLevelSkills && currentLevelSkills.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {currentLevelSkills.map(skill => {
                    const isSelected = selectedSkills.includes(skill.id)
                    const isMastered = masteredSkills.includes(skill.id)

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleSkillToggle(skill.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? isMastered
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-[#23a1c0] text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {skill.name}
                        {isMastered && isSelected && (
                          <span className="ml-1.5">✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkills([])
                      setMasteredSkills([])
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Skip
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedSkills.length} selected • {masteredSkills.length} mastered
                  </span>
                </div>

                {/* Mastered skills toggle for selected skills */}
                {selectedSkills.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mark-all-mastered"
                        checked={masteredSkills.length === selectedSkills.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMasteredSkills([...selectedSkills])
                          } else {
                            setMasteredSkills([])
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="mark-all-mastered"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        Mark all selected skills as mastered this lesson
                      </Label>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  {currentLevelId
                    ? 'No skills found for current level. Skills will be added as the swimmer progresses.'
                    : 'Current level not available. Skills selection disabled.'}
                </p>
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
                    <p className="font-medium text-green-700">{getSkillName(skillId)}</p>
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
            size="lg"
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