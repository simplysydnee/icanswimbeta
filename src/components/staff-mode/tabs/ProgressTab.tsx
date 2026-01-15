'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, Clock, Circle, Target, ChevronDown, ChevronRight, Award, TrendingUp } from 'lucide-react'
import UpdateSkillModal from '../modals/UpdateSkillModal'

interface Skill {
  id: string
  name: string
  description: string | null
  level_id: string
  level_name: string
  level_sequence: number
  status: 'not_started' | 'in_progress' | 'mastered'
  date_mastered: string | null
}

interface SkillsByLevel {
  level_name: string
  level_sequence: number
  skills: Skill[]
}

interface ProgressTabProps {
  swimmerId: string
  currentLevelId: string | null
  levelSequence: number | null
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
      .select('skill_id, status, date_mastered')
      .eq('swimmer_id', swimmerId)

    if (swimmerSkillsError) {
      console.error('Error fetching swimmer skills:', swimmerSkillsError)
      throw new Error('Failed to fetch swimmer skill statuses')
    }

    // Create a map of swimmer skill statuses
    const skillStatusMap = new Map(
      swimmerSkills?.map(skill => [
        skill.skill_id,
        {
          status: skill.status as 'not_started' | 'in_progress' | 'mastered',
          date_mastered: skill.date_mastered
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
        date_mastered: null
      }

      levelsMap.get(levelId)!.skills.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        level_id: skill.level_id,
        level_name: levelName,
        level_sequence: levelSequence,
        ...skillStatus
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

  try {
    const now = new Date().toISOString()
    const updateData = {
      status,
      updated_at: now,
      ...(status === 'mastered' ? { date_mastered: now.split('T')[0] } : {}) // Store as date only
    }

    // Check if skill record exists
    const { data: existing, error: checkError } = await supabase
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
      console.error('Error updating skill status:', result.error)
      throw new Error('Failed to update skill status')
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateSkillStatus:', error)
    throw error
  }
}

export default function ProgressTab({
  swimmerId,
  currentLevelId,
  levelSequence,
  levelName,
  instructorId
}: ProgressTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

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

  const handleMarkMastered = (skillId: string) => {
    setUpdatingSkillId(skillId)
    updateMutation.mutate({ skillId, status: 'mastered' })
  }

  const handleOpenUpdateModal = (skill: Skill) => {
    setSelectedSkill(skill)
    setShowUpdateModal(true)
  }

  const toggleLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels)
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId)
    } else {
      newExpanded.add(levelId)
    }
    setExpandedLevels(newExpanded)
  }

  // Calculate progress stats
  const allSkills = skillsByLevel?.flatMap(level => level.skills) || []
  const masteredCount = allSkills.filter(skill => skill.status === 'mastered').length
  const inProgressCount = allSkills.filter(skill => skill.status === 'in_progress').length
  const notStartedCount = allSkills.filter(skill => skill.status === 'not_started').length
  const totalSkills = allSkills.length
  const progressPercentage = totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0

  // Get skills for "Focus Today" section (in_progress skills)
  const focusSkills = allSkills.filter(skill => skill.status === 'in_progress')

  // Determine level group
  const isRedWhiteGroup = levelSequence !== null && levelSequence <= 2
  const levelGroupBadge = isRedWhiteGroup ? '🔴⚪' : '🟡🟢🔵'

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
      {/* Progress Summary Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {levelGroupBadge}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {levelName || 'Current Level'}
                </h3>
                <p className="text-gray-600">
                  {isRedWhiteGroup ? 'Red/White Group' : 'Yellow/Green/Blue Group'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2a5e84"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercentage}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{progressPercentage}%</span>
                  <span className="text-sm text-gray-600">Progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{masteredCount}</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Mastered</p>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-2xl font-bold text-amber-700">{inProgressCount}</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">In Progress</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center gap-2">
                <Circle className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-700">{notStartedCount}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Not Started</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Focus Today Section */}
      {focusSkills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-[#2a5e84]" />
              <h3 className="text-xl font-bold text-gray-900">🎯 Focus Today</h3>
              <Badge className="bg-[#2a5e84] hover:bg-[#1e4565]">
                {focusSkills.length} skill{focusSkills.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-4">
              {focusSkills.map(skill => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{skill.name}</h4>
                      <p className="text-sm text-gray-600">{skill.level_name}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleMarkMastered(skill.id)}
                    disabled={updatingSkillId === skill.id}
                  >
                    {updatingSkillId === skill.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Mark Mastered'
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Quick action:</span> Focus on these skills during today's lesson.
                Mark as mastered when the swimmer demonstrates consistent proficiency.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills by Level Sections */}
      <div className="space-y-4">
        {skillsByLevel?.map(level => {
          const isExpanded = expandedLevels.has(level.level_name)
          const levelMasteredCount = level.skills.filter(s => s.status === 'mastered').length
          const levelTotalCount = level.skills.length
          const levelProgress = levelTotalCount > 0 ? Math.round((levelMasteredCount / levelTotalCount) * 100) : 0

          return (
            <Card key={level.level_name}>
              <CardContent className="pt-6">
                {/* Level Header */}
                <div
                  className="flex items-center justify-between cursor-pointer p-3 -mx-3 rounded-lg hover:bg-gray-50"
                  onClick={() => toggleLevel(level.level_name)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-[#2a5e84]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#2a5e84]" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-[#2a5e84]">
                        {level.level_name} Level
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600">
                          {levelMasteredCount} of {levelTotalCount} skills mastered
                        </span>
                        <Badge variant="outline" className="text-[#2a5e84] border-[#2a5e84]">
                          {levelProgress}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl">
                    {level.level_sequence <= 2 ? '🔴⚪' : '🟡🟢🔵'}
                  </div>
                </div>

                {/* Level Skills (collapsible) */}
                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {level.skills.map(skill => {
                      const isUpdating = updatingSkillId === skill.id

                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#6abedc] transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Status Icon */}
                            <div className="shrink-0">
                              {skill.status === 'mastered' && (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              )}
                              {skill.status === 'in_progress' && (
                                <Clock className="h-6 w-6 text-amber-500" />
                              )}
                              {skill.status === 'not_started' && (
                                <Circle className="h-6 w-6 text-gray-300" />
                              )}
                            </div>

                            {/* Skill Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{skill.name}</h4>
                              {skill.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {skill.description}
                                </p>
                              )}
                              {skill.date_mastered && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Mastered on {format(new Date(skill.date_mastered), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>

                            {/* Update Button */}
                            <div className="shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenUpdateModal(skill)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Update'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {skillsByLevel?.length === 0 && (
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

      {/* Update Skill Modal */}
      {selectedSkill && (
        <UpdateSkillModal
          open={showUpdateModal}
          onOpenChange={setShowUpdateModal}
          skill={selectedSkill}
          swimmerId={swimmerId}
          instructorId={instructorId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['swimmerSkills', swimmerId] })
            queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
          }}
        />
      )}

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>Track skill progress by updating status. Mark skills as "In Progress" when introduced, and "Mastered" when consistently demonstrated.</p>
        <p className="mt-1">All updates are tracked with timestamp and instructor ID for accountability.</p>
      </div>
    </div>
  )
}