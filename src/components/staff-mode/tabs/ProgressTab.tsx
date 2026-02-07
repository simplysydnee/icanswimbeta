'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Award } from 'lucide-react'
import ThreeStateSwitch from '../ThreeStateSwitch'
import InlineNote from '../InlineNote'

interface Skill {
  id: string
  name: string
  description: string | null
  level_id: string
  level_name: string
  level_sequence: number
  status: 'not_started' | 'in_progress' | 'mastered'
  date_mastered: string | null
  instructor_notes: string | null
}

interface SkillsByLevel {
  level_name: string
  level_sequence: number
  skills: Skill[]
}

interface ProgressTabProps {
  swimmerId: string
  levelName: string | null
  instructorId: string
}

async function fetchSwimmerSkills(swimmerId: string): Promise<SkillsByLevel[]> {
  const supabase = createClient()

  try {
    // Fetch all skills with their level info
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select(`
        id,
        name,
        description,
        level_id,
        swim_levels!inner (
          name,
          sequence
        )
      `)
      .order('swim_levels(sequence)')
      .order('name')

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
      throw new Error('Failed to fetch skills')
    }

    // Fetch this swimmer's skill statuses
    const { data: swimmerSkills, error: swimmerSkillsError } = await supabase
      .from('swimmer_skills')
      .select('skill_id, status, date_mastered, instructor_notes')
      .eq('swimmer_id', swimmerId)

    if (swimmerSkillsError) {
      console.error('Error fetching swimmer skills:', swimmerSkillsError)
      throw new Error('Failed to fetch swimmer skill statuses')
    }

    // Create a map of swimmer skill statuses
    const skillStatusMap = new Map<string, {
      status: 'not_started' | 'in_progress' | 'mastered',
      date_mastered: string | null,
      instructor_notes: string | null
    }>(
      swimmerSkills?.map(skill => [
        skill.skill_id,
        {
          status: skill.status as 'not_started' | 'in_progress' | 'mastered',
          date_mastered: skill.date_mastered,
          instructor_notes: skill.instructor_notes
        }
      ]) || []
    )

    // Group skills by level
    const levelsMap = new Map<string, SkillsByLevel>()

    allSkills?.forEach(skill => {
      const levelId = skill.level_id
      const levelName = skill.swim_levels?.name || 'Unknown'
      const levelSequence = skill.swim_levels?.sequence || 0

      if (!levelsMap.has(levelId)) {
        levelsMap.set(levelId, {
          level_name: levelName,
          level_sequence: levelSequence,
          skills: []
        })
      }

      const skillStatus = skillStatusMap.get(skill.id) || {
        status: 'not_started' as const,
        date_mastered: null,
        instructor_notes: null
      }

      levelsMap.get(levelId)!.skills.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        level_id: skill.level_id,
        level_name: levelName,
        level_sequence: levelSequence,
        status: skillStatus.status,
        date_mastered: skillStatus.date_mastered,
        instructor_notes: skillStatus.instructor_notes
      })
    })

    // Convert map to array and sort by level sequence
    const levelsArray = Array.from(levelsMap.values())
    levelsArray.sort((a, b) => a.level_sequence - b.level_sequence)

    return levelsArray

  } catch (error) {
    console.error('Error in fetchSwimmerSkills:', error)
    throw error
  }
}

async function updateSkillStatus(
  swimmerId: string,
  skillId: string,
  status: 'not_started' | 'in_progress' | 'mastered',
  instructorId: string
) {
  const supabase = createClient()
  console.log('updateSkillStatus called:', { swimmerId, skillId, status, instructorId })

  try {
    // Use the passed instructorId for staff mode (selected instructor in staff mode)
    const updatedBy = instructorId
    console.log('Using instructorId for updated_by:', { instructorId: updatedBy })

    const now = new Date().toISOString()
    const updateData: any = {
      status,
      updated_at: now,
      updated_by: updatedBy,
      ...(status === 'mastered' ? { date_mastered: now.split('T')[0] } : { date_mastered: null }) // Clear date_mastered if not mastered
    }

    // Check if skill record exists
    const { error: checkError } = await supabase
      .from('swimmer_skills')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .eq('skill_id', skillId)
      .single()

    let result

    if (checkError && checkError.code === 'PGRST116') {
      // Record doesn't exist, insert new
      result = await supabase
        .from('swimmer_skills')
        .insert({
          swimmer_id: swimmerId,
          skill_id: skillId,
          ...updateData,
          created_at: now
        })
    } else {
      // Record exists, update
      result = await supabase
        .from('swimmer_skills')
        .update(updateData)
        .eq('swimmer_id', swimmerId)
        .eq('skill_id', skillId)
    }

    if (result.error) {
      console.error('Error updating skill status:', {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      })
      throw new Error(`Failed to update skill status: ${result.error.message || 'Unknown error'}`)
    }

    console.log('Skill status updated successfully')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSkillStatus:', {
      error,
      swimmerId,
      skillId,
      status,
      instructorId
    })
    throw error
  }
}

async function updateSkillNote(
  swimmerId: string,
  skillId: string,
  instructor_notes: string,
  instructorId: string
) {
  const supabase = createClient()
  console.log('updateSkillNote called:', { swimmerId, skillId, instructor_notes, instructorId })

  try {
    // Use the passed instructorId for staff mode (selected instructor in staff mode)
    const updatedBy = instructorId
    console.log('Using instructorId for note update:', { instructorId: updatedBy })

    const now = new Date().toISOString()
    const updateData = {
      instructor_notes: instructor_notes.trim() || null,
      updated_at: now,
      updated_by: updatedBy
    }

    // Check if skill record exists
    const { error: checkError } = await supabase
      .from('swimmer_skills')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .eq('skill_id', skillId)
      .single()

    let result

    if (checkError && checkError.code === 'PGRST116') {
      // Record doesn't exist, insert new
      result = await supabase
        .from('swimmer_skills')
        .insert({
          swimmer_id: swimmerId,
          skill_id: skillId,
          ...updateData,
          status: 'not_started',
          created_at: now
        })
    } else {
      // Record exists, update
      result = await supabase
        .from('swimmer_skills')
        .update(updateData)
        .eq('swimmer_id', swimmerId)
        .eq('skill_id', skillId)
    }

    if (result.error) {
      console.error('Error updating skill note:', {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      })
      throw new Error(`Failed to update skill note: ${result.error.message || 'Unknown error'}`)
    }

    console.log('Skill note updated successfully')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSkillNote:', {
      error,
      swimmerId,
      skillId,
      instructor_notes,
      instructorId
    })
    throw error
  }
}

export default function ProgressTab({
  swimmerId,
  levelName,
  instructorId
}: ProgressTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null)

  const { data: skillsByLevel, isLoading, error } = useQuery({
    queryKey: ['swimmerSkills', swimmerId],
    queryFn: () => fetchSwimmerSkills(swimmerId),
    enabled: !!swimmerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const updateMutation = useMutation({
    mutationFn: ({ skillId, status }: { skillId: string; status: 'not_started' | 'in_progress' | 'mastered' }) =>
      updateSkillStatus(swimmerId, skillId, status, instructorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmerSkills', swimmerId] })
      queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
      toast({
        title: 'Skill updated',
        description: 'Skill status has been updated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update skill',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setUpdatingSkillId(null)
    }
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ skillId, instructor_notes }: { skillId: string; instructor_notes: string }) =>
      updateSkillNote(swimmerId, skillId, instructor_notes, instructorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmerSkills', swimmerId] })
      toast({
        title: 'Note saved',
        description: 'Skill note has been saved successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save note',
        variant: 'destructive',
      })
    }
  })

  const handleUpdateSkill = (skillId: string, newStatus: 'not_started' | 'in_progress' | 'mastered') => {
    console.log('handleUpdateSkill called:', { skillId, newStatus })
    setUpdatingSkillId(skillId)
    updateMutation.mutate({ skillId, status: newStatus })
  }

  const handleUpdateSkillNote = (skillId: string, note: string) => {
    updateNoteMutation.mutate({ skillId, instructor_notes: note })
  }


  // Define level groups
  const BEGINNER_LEVELS = ['white', 'red']
  const INTERMEDIATE_LEVELS = ['yellow', 'green', 'blue']

  // Determine which group the swimmer belongs to based on current level
  const currentLevelLower = levelName?.toLowerCase() || ''
  const isBeginnerGroup = BEGINNER_LEVELS.includes(currentLevelLower)
  const levelGroup = isBeginnerGroup ? BEGINNER_LEVELS : INTERMEDIATE_LEVELS

  // Filter skills to only show levels in the appropriate group
  const filteredSkillsByLevel = skillsByLevel?.filter(level => {
    const levelNameLower = level.level_name.toLowerCase()
    return levelGroup.some(groupLevel => levelNameLower.includes(groupLevel))
  }) || []

  // Recalculate stats based on filtered skills
  const filteredAllSkills = filteredSkillsByLevel.flatMap(level => level.skills) || []
  const filteredMasteredCount = filteredAllSkills.filter(skill => skill.status === 'mastered').length
  const filteredInProgressCount = filteredAllSkills.filter(skill => skill.status === 'in_progress').length
  const filteredNotStartedCount = filteredAllSkills.filter(skill => skill.status === 'not_started').length
  const filteredTotalSkills = filteredAllSkills.length
  const filteredProgressPercentage = filteredTotalSkills > 0 ? Math.round((filteredMasteredCount / filteredTotalSkills) * 100) : 0

  // Level group badge
  const levelGroupBadge = isBeginnerGroup ? '🔴⚪' : '🟡🟢🔵'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#6abedc]" />
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
            <p className="text-red-600 font-medium">Error loading skills</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch skills'}
            </p>
            <Button
              variant="outline"
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
      {/* Progress Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Progress: {filteredProgressPercentage}% ({filteredMasteredCount}/{filteredTotalSkills} skills)</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">{filteredMasteredCount} mastered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">{filteredInProgressCount} in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-600">{filteredNotStartedCount} not started</span>
              </div>
            </div>
          </div>
          <div className="text-3xl">
            {levelGroupBadge}
          </div>
        </div>
      </div>


      {/* Skills by Level */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredSkillsByLevel.map(level => {
          const levelMasteredCount = level.skills.filter(s => s.status === 'mastered').length
          const levelTotalCount = level.skills.length

          // Get level emoji based on level name
          const getLevelEmoji = (levelName: string) => {
            const lowerName = levelName.toLowerCase()
            if (lowerName.includes('white')) return '⚪'
            if (lowerName.includes('red')) return '🔴'
            if (lowerName.includes('yellow')) return '🟡'
            if (lowerName.includes('green')) return '🟢'
            if (lowerName.includes('blue')) return '🔵'
            return '⚪'
          }

          const levelEmoji = getLevelEmoji(level.level_name)

          return (
            <div key={level.level_name} className="border-b border-gray-200 last:border-b-0">
              {/* Level Header */}
              <div className="px-4 py-2 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{levelEmoji}</span>
                    <h3 className="font-semibold text-gray-900 uppercase">
                      {level.level_name} ({levelMasteredCount}/{levelTotalCount})
                    </h3>
                  </div>
                </div>
              </div>

              {/* Level Separator */}
              <div className="h-px bg-gray-300"></div>

              {/* Skills List */}
              <div className="divide-y divide-gray-100">
                {level.skills.map(skill => {
                  const isUpdating = updatingSkillId === skill.id

                  return (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between px-4 py-1.5 hover:bg-gray-50"
                    >
                      {/* Skill Name */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate text-sm">{skill.name}</span>
                          {skill.date_mastered && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              • {format(new Date(skill.date_mastered), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {skill.description && (
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {skill.description}
                          </p>
                        )}
                      </div>

                      {/* Status and Note Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <ThreeStateSwitch
                          value={skill.status || 'not_started'}
                          onChange={(newStatus) => handleUpdateSkill(skill.id, newStatus)}
                          size="xs"
                          disabled={isUpdating}
                        />
                        <div className="w-32">
                          <InlineNote
                            value={skill.instructor_notes}
                            onSave={(note) => handleUpdateSkillNote(skill.id, note)}
                            placeholder="Add note..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredSkillsByLevel.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No skills found</h3>
              <p className="text-gray-500 mt-2">
                Skills data is not available for this swimmer. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>Track skill progress using the status switches and add notes for each skill. Mark skills as "In Progress" when introduced, and "Mastered" when consistently demonstrated.</p>
        <p className="mt-1">All updates are tracked with timestamp and instructor ID for accountability.</p>
      </div>
    </div>
  )
}