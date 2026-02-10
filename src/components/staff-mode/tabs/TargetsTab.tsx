'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Target, CheckCircle } from 'lucide-react'

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
        // Sanitize target name for placeholder ID: lowercase, replace spaces and slashes with hyphens
        const sanitizedTargetName = targetName.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/\//g, '-') // Replace slashes with hyphens
          .replace(/[^\w-]/g, ''); // Remove any other non-word characters except hyphens
        allTargets.push({
          id: `placeholder-${sanitizedTargetName}`,
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
  console.log('updateTargetStatus called:', { swimmerId, targetId, targetName, status, instructorId, instructorIdType: typeof instructorId })

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
    console.log('Using instructorId for updated_by:', { instructorId: updatedBy, original: instructorId })

    const now = new Date().toISOString()
    const updateData: any = {
      status,
      updated_at: now,
      updated_by: updatedBy,
      notes: notes || null,
      ...(status === 'mastered' ? { date_met: now } : { date_met: null }),
      // date_started is handled by database trigger when status changes to in_progress
    }

    // If this is a placeholder ID, don't query the database with it
    const isPlaceholder = targetId.startsWith('placeholder-')

    let result

    if (isPlaceholder) {
      // Placeholder target - always insert new
      console.log('Inserting new target for placeholder:', targetName)
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
      // Check if target record exists
      const { error: checkError } = await supabase
        .from('swimmer_targets')
        .select('id, status')
        .eq('swimmer_id', swimmerId)
        .eq('id', targetId)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // Record doesn't exist, insert new
        console.log('Target not found, inserting new:', targetName)
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
      } else if (checkError) {
        // Some other error
        console.error('Error checking target existence:', {
          message: checkError.message,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint
        })
        throw new Error(`Failed to check target: ${checkError.message || 'Unknown error'}`)
      } else {
        // Record exists, update
        console.log('Updating existing target:', targetId)
        result = await supabase
          .from('swimmer_targets')
          .update(updateData)
          .eq('id', targetId)
          .select()
          .single()
      }
    }

    if (result.error) {
      console.error('Error updating target status:', {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      })
      throw new Error(`Failed to update target status: ${result.error.message || 'Unknown error'}`)
    }

    console.log('Target status updated successfully:', result.data)
    return result.data

  } catch (error) {
    console.error('Error in updateTargetStatus:', {
      error,
      swimmerId,
      targetId,
      targetName,
      status,
      instructorId
    })
    throw error
  }
}

export default function TargetsTab({
  swimmerId,
  instructorId
}: TargetsTabProps) {
  console.log('TargetsTab instructorId:', instructorId, typeof instructorId);
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [updatingTargetId, setUpdatingTargetId] = useState<string | null>(null)

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
    <div className="space-y-4 p-4">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">I Can Swim Targets</h2>
              <p className="text-xs text-gray-500">Standard skill progression checklist</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {masteredCount}<span className="text-gray-400">/{totalTargets}</span>
            </div>
            <div className="text-xs text-gray-500">Met</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-700">{masteredCount}</div>
            <div className="text-xs text-green-600">Met</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{inProgressCount}</div>
            <div className="text-xs text-amber-600">In Progress</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-700">{notStartedCount}</div>
            <div className="text-xs text-gray-600">Not Started</div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
        <Target className="w-4 h-4 text-blue-500" />
        <span>Tap status button to cycle: Not Started → In Progress → Met → Not Started</span>
      </div>

      {/* Compact Targets List - iPad-friendly touch targets */}
      <div className="space-y-1">
        {targets?.map((target, index) => {
          const isUpdating = updatingTargetId === target.id

          // Determine next status for cycling
          const getNextStatus = (currentStatus: 'not_started' | 'in_progress' | 'mastered') => {
            if (currentStatus === 'not_started') return 'in_progress'
            if (currentStatus === 'in_progress') return 'mastered'
            return 'not_started' // mastered -> not_started
          }

          const handleTap = () => {
            if (isUpdating) return
            const nextStatus = getNextStatus(target.status)
            setUpdatingTargetId(target.id)
            updateMutation.mutate({
              targetId: target.id,
              targetName: target.target_name,
              status: nextStatus
            })
          }

          // Status colors and icons
          const statusConfig = {
            not_started: {
              bg: 'bg-gray-100',
              border: 'border-gray-300',
              text: 'text-gray-700',
              buttonBg: 'bg-gray-200',
              buttonText: 'text-gray-700',
              buttonHover: 'hover:bg-gray-300',
              label: 'Not Started'
            },
            in_progress: {
              bg: 'bg-amber-50',
              border: 'border-amber-300',
              text: 'text-amber-800',
              buttonBg: 'bg-amber-500',
              buttonText: 'text-white',
              buttonHover: 'hover:bg-amber-600',
              label: 'In Progress'
            },
            mastered: {
              bg: 'bg-green-50',
              border: 'border-green-300',
              text: 'text-green-800',
              buttonBg: 'bg-green-500',
              buttonText: 'text-white',
              buttonHover: 'hover:bg-green-600',
              label: 'Met'
            }
          }

          const config = statusConfig[target.status]

          return (
            <div
              key={target.id}
              className={`flex items-center justify-between min-h-[48px] px-4 py-3 rounded-lg border ${config.bg} ${config.border} ${config.text}`}
            >
              {/* Target Name on Left */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Target Number */}
                <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-700 text-sm">{index + 1}</span>
                </div>

                {/* Target Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{target.target_name}</div>
                  {target.date_met && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Met {format(new Date(target.date_met), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Button on Right */}
              <button
                onClick={handleTap}
                disabled={isUpdating}
                className={`flex items-center justify-center min-w-[100px] h-11 px-4 rounded-lg font-medium transition-colors ${config.buttonBg} ${config.buttonText} ${config.buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={`Change status from ${config.label}`}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  config.label
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {(!targets || targets.length === 0) && (
        <div className="text-center py-8">
          <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No targets found</h3>
          <p className="text-gray-500 text-sm mt-1">
            Targets data is not available for this swimmer.
          </p>
        </div>
      )}


      {/* Bottom Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="font-medium text-blue-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          How to use targets
        </h4>
        <ul className="mt-2 text-xs text-blue-700 space-y-1">
          <li>• Tap status button to cycle through statuses</li>
          <li>• "Met" targets automatically record date and instructor</li>
          <li>• All 10 targets fit on iPad screen without scrolling</li>
          <li>• Large touch targets (48px min height) for poolside use</li>
        </ul>
      </div>
    </div>
  )
}