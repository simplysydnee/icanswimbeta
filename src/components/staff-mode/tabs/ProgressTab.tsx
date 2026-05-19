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
    // Fetch ONLY skills this swimmer has records for
    const { data: swimmerSkills, error: ssError } = await supabase
      .from('swimmer_skills')
      .select('id, skill_id, status, date_started, date_mastered, instructor_notes')
      .eq('swimmer_id', swimmerId)

    if (ssError) {
      console.error('Error fetching swimmer skills:', ssError)
      throw new Error('Failed to fetch swimmer skills')
    }

    if (!swimmerSkills || swimmerSkills.length === 0) {
      return []
    }

    // Get unique skill IDs
    const skillIds = [...new Set(swimmerSkills.map((s) => s.skill_id))]

    // Fetch skill and level info for those skills
    const { data: skillsData, error: skError } = await supabase
      .from('skills')
      .select(`
        id, name, description, sequence, level_id,
        swim_levels!inner (
          name,
          sequence,
          color
        )
      `)
      .in('id', skillIds)
      .order('name')

    if (skError) {
      console.error('Error fetching skill details:', skError)
      throw new Error('Failed to fetch skill details')
    }

    // Build a lookup map for skill details
    const skillInfoMap = new Map<string, typeof skillsData[0]>()
    skillsData?.forEach((s) => skillInfoMap.set(s.id, s))

    // Group by level
    const levelsMap = new Map<string, SkillsByLevel>()

    swimmerSkills.forEach((record) => {
      const skillInfo = skillInfoMap.get(record.skill_id)
      if (!skillInfo) return

      const levelId = skillInfo.level_id
      const levelName = skillInfo.swim_levels?.name || 'Unknown'
      const levelSequence = skillInfo.swim_levels?.sequence || 0

      if (!levelsMap.has(levelId)) {
        levelsMap.set(levelId, {
          level_name: levelName,
          level_sequence: levelSequence,
          skills: [],
        })
      }

      levelsMap.get(levelId)!.skills.push({
        id: record.skill_id,
        name: skillInfo.name,
        description: skillInfo.description,
        level_id: levelId,
        level_name: levelName,
        level_sequence: levelSequence,
        status: record.status as 'not_started' | 'in_progress' | 'mastered',
        date_mastered: record.date_mastered,
        instructor_notes: record.instructor_notes,
      })
    })

    // Sort by level sequence, then by skill name within each level
    const levelsArray = Array.from(levelsMap.values())
    levelsArray.sort((a, b) => a.level_sequence - b.level_sequence)
    levelsArray.forEach((level) => {
      level.skills.sort((a, b) => a.name.localeCompare(b.name))
    })

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

  try {
    // Normalize instructorId - could be string or object with id property
    const normalizeInstructorId = (id: any): string | null => {
      if (typeof id === 'string') return id || null;
      if (id && typeof id === 'object' && 'id' in id) {
        return typeof id.id === 'string' ? id.id : null;
      }
      return null;
    };
    const updatedBy = normalizeInstructorId(instructorId);

    const now = new Date().toISOString()
    const today = now.split('T')[0]
    const updateData: any = {
      status,
      updated_at: now,
      updated_by: updatedBy,
      ...(status === 'mastered' ? { date_mastered: today } : { date_mastered: null }) // Clear date_mastered if not mastered
    }

    // Check if skill record exists
    const { error: checkError } = await supabase
      .from('swimmer_skills')
      .select('id, status, date_started')
      .eq('swimmer_id', swimmerId)
      .eq('skill_id', skillId)
      .single()

    let result

    if (checkError && checkError.code === 'PGRST116') {
      // Record doesn't exist, insert new
      const insertData = {
        swimmer_id: swimmerId,
        skill_id: skillId,
        ...updateData,
        created_at: now,
        // Set date_started if status is in_progress
        ...(status === 'in_progress' ? { date_started: today } : {})
      }
      result = await supabase
        .from('swimmer_skills')
        .insert(insertData)
    } else {
      // Record exists, update
      // Note: date_started is handled by trigger when status changes to in_progress
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

  try {
    // Normalize instructorId - could be string or object with id property
    const normalizeInstructorId = (id: any): string | null => {
      if (typeof id === 'string') return id || null;
      if (id && typeof id === 'object' && 'id' in id) {
        return typeof id.id === 'string' ? id.id : null;
      }
      return null;
    };
    const updatedBy = normalizeInstructorId(instructorId);

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
    setUpdatingSkillId(skillId)
    updateMutation.mutate({ skillId, status: newStatus })
  }

  const handleUpdateSkillNote = (skillId: string, note: string) => {
    updateNoteMutation.mutate({ skillId, instructor_notes: note })
  }


  // Compute stats directly from the swimmer's actual skills (only levels they have records for)
  const allSwimmerSkills = (skillsByLevel?.flatMap(level => level.skills) || [])
  const masteredCount = allSwimmerSkills.filter(skill => skill.status === 'mastered').length
  const inProgressCount = allSwimmerSkills.filter(skill => skill.status === 'in_progress').length
  const notStartedCount = allSwimmerSkills.filter(skill => skill.status === 'not_started').length
  const totalSwimmerSkills = allSwimmerSkills.length
  const progressPercentage = totalSwimmerSkills > 0 ? Math.round((masteredCount / totalSwimmerSkills) * 100) : 0

  // Dynamic level badges — only show levels this swimmer actually has skills for
  const getLevelEmoji = (levelName: string) => {
    const lower = levelName.toLowerCase()
    if (lower.includes('white')) return '⚪'
    if (lower.includes('red')) return '🔴'
    if (lower.includes('yellow')) return '🟡'
    if (lower.includes('green')) return '🟢'
    if (lower.includes('blue')) return '🔵'
    return '⚪'
  }
  const levelBadges = skillsByLevel?.map(l => getLevelEmoji(l.level_name)).join(' ') || ''

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
            <h2 className="text-lg font-semibold text-gray-900">Progress: {progressPercentage}% ({masteredCount}/{totalSwimmerSkills} skills)</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">{masteredCount} mastered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">{inProgressCount} in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-600">{notStartedCount} not started</span>
              </div>
            </div>
          </div>
          <div className="text-3xl">
            {levelBadges}
          </div>
        </div>
      </div>


      {/* Skills by Level */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {skillsByLevel?.map(level => {
          const levelMasteredCount = level.skills.filter((s: { status: string }) => s.status === 'mastered').length
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
                          size="sm"
                          disabled={isUpdating}
                        />
                        <div className="min-w-48 w-full max-w-xs">
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
      {(!skillsByLevel || skillsByLevel.length === 0) && (
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


    </div>
  )
}
