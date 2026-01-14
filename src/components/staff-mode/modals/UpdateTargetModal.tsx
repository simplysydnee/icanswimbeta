'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Target, CheckCircle, Clock, Circle } from 'lucide-react'

interface SwimmerTarget {
  id: string
  target_name: string
  status: 'not_started' | 'in_progress' | 'mastered'
  date_met: string | null
  notes: string | null
}

interface UpdateTargetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: SwimmerTarget
  swimmerId: string
  instructorId: string
  onSuccess?: () => void
}

async function updateTargetStatusWithNotes(
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
    console.error('Error in updateTargetStatusWithNotes:', error)
    throw error
  }
}

export default function UpdateTargetModal({
  open,
  onOpenChange,
  target,
  swimmerId,
  instructorId,
  onSuccess
}: UpdateTargetModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SwimmerTarget['status']>(target.status)
  const [notes, setNotes] = useState(target.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => updateTargetStatusWithNotes(swimmerId, target.id, target.target_name, status, instructorId, notes),
    onSuccess: (updatedTarget) => {
      toast({
        title: 'Target updated',
        description: `${updatedTarget.target_name} has been marked as ${updatedTarget.status.replace('_', ' ')}.`,
      })
      queryClient.invalidateQueries({ queryKey: ['swimmerTargets', swimmerId] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update target',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const handleSubmit = () => {
    setIsSubmitting(true)
    updateMutation.mutate()
  }

  const getStatusIcon = (statusValue: SwimmerTarget['status']) => {
    switch (statusValue) {
      case 'mastered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'not_started':
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusDescription = (statusValue: SwimmerTarget['status']) => {
    switch (statusValue) {
      case 'mastered':
        return 'Swimmer consistently demonstrates this skill'
      case 'in_progress':
        return 'Skill is being practiced and developed'
      case 'not_started':
        return 'Skill has not been introduced yet'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Update Target Status
          </DialogTitle>
          <DialogDescription>
            Update the status for: {target.target_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(target.status)}
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <p className="text-sm text-gray-600 capitalize">
                  {target.status.replace('_', ' ')}
                </p>
                {target.date_met && (
                  <p className="text-xs text-gray-500 mt-1">
                    Met on {new Date(target.date_met).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <Label>Select New Status</Label>
            <RadioGroup value={status} onValueChange={(value) => setStatus(value as SwimmerTarget['status'])}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="not_started" id="not_started" />
                <div className="flex items-center gap-3 flex-1">
                  <Circle className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="not_started" className="font-medium cursor-pointer">
                      Not Started
                    </Label>
                    <p className="text-sm text-gray-600">
                      Skill has not been introduced yet
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="in_progress" id="in_progress" />
                <div className="flex items-center gap-3 flex-1">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <Label htmlFor="in_progress" className="font-medium cursor-pointer">
                      In Progress
                    </Label>
                    <p className="text-sm text-gray-600">
                      Skill is being practiced and developed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="mastered" id="mastered" />
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <Label htmlFor="mastered" className="font-medium cursor-pointer">
                      Met
                    </Label>
                    <p className="text-sm text-gray-600">
                      Swimmer consistently demonstrates this skill
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add observations, progress notes, or specific details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Notes will be saved with the target update and visible to other instructors.
            </p>
          </div>

          {/* Auto-date Note */}
          {status === 'mastered' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">
                  Date will be automatically recorded when marked as "Met"
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Mark as ${status.replace('_', ' ')}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}