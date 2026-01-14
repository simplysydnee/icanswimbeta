'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Target, CheckCircle, Clock, Circle, TrendingUp } from 'lucide-react'
import UpdateTargetModal from '../modals/UpdateTargetModal'

interface SwimmerTarget {
  id: string
  target_name: string
  status: 'not_started' | 'in_progress' | 'mastered'
  date_met: string | null
  notes: string | null
  updated_by: string | null
  updated_at: string
}

interface TargetsTabProps {
  swimmerId: string
  instructorId: string
}

// Standard I Can Swim Targets (10 targets)
const STANDARD_TARGETS = [
  'Wears full face goggles',
  'Hand walking to stairs & Ladder',
  'Ladder/stair climbing',
  'Jump in (with support)',
  'Jump in and climb out independently',
  'Retrieves objects from bottom (shallow)',
  'Bobs 3x',
  'Forward movement 3 body lengths',
  'Rolls to back',
  'Floats on back 5 seconds'
]

async function fetchSwimmerTargets(swimmerId: string): Promise<SwimmerTarget[]> {
  const supabase = createClient()

  try {
    // Fetch existing targets for this swimmer
    const { data: existingTargets, error: targetsError } = await supabase
      .from('swimmer_targets')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('created_at')

    if (targetsError) {
      console.error('Error fetching swimmer targets:', targetsError)
      throw new Error('Failed to fetch swimmer targets')
    }

    // Create a map of existing targets by name for quick lookup
    const existingTargetsMap = new Map(
      existingTargets?.map(target => [target.target_name, target]) || []
    )

    // Ensure all standard targets exist
    const allTargets: SwimmerTarget[] = []

    for (const targetName of STANDARD_TARGETS) {
      const existingTarget = existingTargetsMap.get(targetName)

      if (existingTarget) {
        // Use existing target
        allTargets.push({
          id: existingTarget.id,
          target_name: existingTarget.target_name,
          status: existingTarget.status,
          date_met: existingTarget.date_met,
          notes: existingTarget.notes,
          updated_by: existingTarget.updated_by,
          updated_at: existingTarget.updated_at
        })
      } else {
        // Create a placeholder for missing target (will be created on first update)
        allTargets.push({
          id: `placeholder-${targetName.toLowerCase().replace(/\s+/g, '-')}`,
          target_name: targetName,
          status: 'not_started',
          date_met: null,
          notes: null,
          updated_by: null,
          updated_at: new Date().toISOString()
        })
      }
    }

    return allTargets

  } catch (error) {
    console.error('Error in fetchSwimmerTargets:', error)
    throw error
  }
}

async function updateTargetStatus(
  swimmerId: string,
  targetId: string,
  targetName: string,
  status: 'not_started' | 'in_progress' | 'mastered',
  instructorId: string,
  notes?: string
) {
  const supabase = createClient()

  try {
    const now = new Date().toISOString()
    const updateData = {
      status,
      updated_by: instructorId,
      updated_at: now,
      notes: notes || null,
      ...(status === 'mastered' ? { date_met: now } : { date_met: null })
    }

    // Check if target record exists
    const { data: existing, error: checkError } = await supabase
      .from('swimmer_targets')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .eq('id', targetId)
      .single()

    let result

    if (checkError || targetId.startsWith('placeholder-')) {
      // Record doesn't exist or is a placeholder, insert new
      result = await supabase
        .from('swimmer_targets')
        .insert({
          swimmer_id: swimmerId,
          target_name: targetName,
          ...updateData,
          created_at: now
        })
        .select()
        .single()
    } else {
      // Record exists, update
      result = await supabase
        .from('swimmer_targets')
        .update(updateData)
        .eq('id', targetId)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating target status:', result.error)
      throw new Error('Failed to update target status')
    }

    return result.data

  } catch (error) {
    console.error('Error in updateTargetStatus:', error)
    throw error
  }
}

export default function TargetsTab({
  swimmerId,
  instructorId
}: TargetsTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [updatingTargetId, setUpdatingTargetId] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<SwimmerTarget | null>(null)

  const { data: targets, isLoading, error } = useQuery({
    queryKey: ['swimmerTargets', swimmerId],
    queryFn: () => fetchSwimmerTargets(swimmerId),
    enabled: !!swimmerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const updateMutation = useMutation({
    mutationFn: ({
      targetId,
      targetName,
      status,
      notes
    }: {
      targetId: string
      targetName: string
      status: 'not_started' | 'in_progress' | 'mastered'
      notes?: string
    }) => updateTargetStatus(swimmerId, targetId, targetName, status, instructorId, notes),
    onSuccess: (updatedTarget) => {
      queryClient.invalidateQueries({ queryKey: ['swimmerTargets', swimmerId] })
      queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
      toast({
        title: 'Target updated',
        description: `${updatedTarget.target_name} has been marked as ${updatedTarget.status.replace('_', ' ')}.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update target',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setUpdatingTargetId(null)
    }
  })

  const handleOpenUpdateModal = (target: SwimmerTarget) => {
    setSelectedTarget(target)
    setShowUpdateModal(true)
  }

  const handleQuickUpdate = (targetId: string, targetName: string, status: 'not_started' | 'in_progress' | 'mastered') => {
    setUpdatingTargetId(targetId)
    updateMutation.mutate({ targetId, targetName, status })
  }

  // Calculate progress stats
  const masteredCount = targets?.filter(target => target.status === 'mastered').length || 0
  const inProgressCount = targets?.filter(target => target.status === 'in_progress').length || 0
  const notStartedCount = targets?.filter(target => target.status === 'not_started').length || 0
  const totalTargets = targets?.length || STANDARD_TARGETS.length
  const progressPercentage = totalTargets > 0 ? Math.round((masteredCount / totalTargets) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
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
            <p className="text-red-600 font-medium">Error loading targets</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch targets'}
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
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">🎯 I Can Swim Targets</h3>
                <p className="text-gray-600">Standard skill progression checklist</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{masteredCount}/{totalTargets}</div>
                <p className="text-sm text-gray-600">Targets met</p>
              </div>
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20" viewBox="0 0 36 36">
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
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercentage}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{progressPercentage}%</span>
                  <span className="text-xs text-gray-600">Progress</span>
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
              <p className="text-sm text-green-600 mt-1">Met</p>
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

      {/* Targets List */}
      <div className="space-y-4">
        {targets?.map((target, index) => {
          const isUpdating = updatingTargetId === target.id

          return (
            <Card key={target.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Target Number */}
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                        <span className="font-bold text-blue-600">{index + 1}</span>
                      </div>
                    </div>

                    {/* Target Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {target.status === 'mastered' && (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          )}
                          {target.status === 'in_progress' && (
                            <Clock className="h-6 w-6 text-amber-500" />
                          )}
                          {target.status === 'not_started' && (
                            <Circle className="h-6 w-6 text-gray-300" />
                          )}
                        </div>

                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {target.target_name}
                        </h4>
                      </div>

                      {/* Target Details */}
                      <div className="space-y-2">
                        {target.date_met && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Met on {format(new Date(target.date_met), 'MMM d, yyyy')}</span>
                          </div>
                        )}

                        {target.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium mb-1">Notes:</p>
                            <p className="line-clamp-2">{target.notes}</p>
                          </div>
                        )}

                        {target.updated_by && (
                          <p className="text-xs text-gray-500">
                            Last updated by instructor
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="shrink-0 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenUpdateModal(target)}
                      disabled={isUpdating}
                      className="min-w-[100px]"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-1">
                      {target.status !== 'mastered' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleQuickUpdate(target.id, target.target_name, 'mastered')}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {target.status !== 'in_progress' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleQuickUpdate(target.id, target.target_name, 'in_progress')}
                          disabled={isUpdating}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {target.status !== 'not_started' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          onClick={() => handleQuickUpdate(target.id, target.target_name, 'not_started')}
                          disabled={isUpdating}
                        >
                          <Circle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {(!targets || targets.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No targets found</h3>
              <p className="text-gray-500 mt-2">
                Targets data is not available for this swimmer. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Target Modal */}
      {selectedTarget && (
        <UpdateTargetModal
          open={showUpdateModal}
          onOpenChange={setShowUpdateModal}
          target={selectedTarget}
          swimmerId={swimmerId}
          instructorId={instructorId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['swimmerTargets', swimmerId] })
            queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
          }}
        />
      )}

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>I Can Swim Targets are standard skill progression milestones. Update status as swimmer progresses.</p>
        <p className="mt-1">Targets marked as "Met" will automatically record the date and instructor ID.</p>
      </div>
    </div>
  )
}