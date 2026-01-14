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
import { Loader2, Award, CheckCircle, Clock, Circle } from 'lucide-react'

interface Skill {
  id: string
  name: string
  description: string | null
  level_name: string
  status: 'not_started' | 'in_progress' | 'mastered'
}

interface UpdateSkillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: Skill
  swimmerId: string
  instructorId: string
  onSuccess?: () => void
}

async function updateSkillStatusWithNotes(
  swimmerId: string,
  skillId: string,
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
      ...(status === 'mastered' ? { mastered_date: now } : {})
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
    console.error('Error in updateSkillStatusWithNotes:', error)
    throw error
  }
}

export default function UpdateSkillModal({
  open,
  onOpenChange,
  skill,
  swimmerId,
  instructorId,
  onSuccess
}: UpdateSkillModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Skill['status']>(skill.status)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => updateSkillStatusWithNotes(swimmerId, skill.id, status, instructorId, notes),
    onSuccess: () => {
      toast({
        title: 'Skill updated',
        description: `${skill.name} has been marked as ${status.replace('_', ' ')}.`,
      })
      queryClient.invalidateQueries({ queryKey: ['swimmerSkills', swimmerId] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update skill',
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

  const getStatusIcon = (statusValue: Skill['status']) => {
    switch (statusValue) {
      case 'mastered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'not_started':
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusDescription = (statusValue: Skill['status']) => {
    switch (statusValue) {
      case 'mastered':
        return 'Swimmer demonstrates consistent proficiency'
      case 'in_progress':
        return 'Skill has been introduced and is being practiced'
      case 'not_started':
        return 'Skill has not been introduced yet'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#2a5e84]" />
            Update Skill Status
          </DialogTitle>
          <DialogDescription>
            Update the status for {skill.name} ({skill.level_name} Level)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(skill.status)}
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <p className="text-sm text-gray-600 capitalize">
                  {skill.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <Label>Select New Status</Label>
            <RadioGroup value={status} onValueChange={(value) => setStatus(value as Skill['status'])}>
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
                      Skill has been introduced and is being practiced
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
                      Mastered
                    </Label>
                    <p className="text-sm text-gray-600">
                      Swimmer demonstrates consistent proficiency
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
              placeholder="Add any observations or notes about this skill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Notes will be saved with the skill update and visible to other instructors.
            </p>
          </div>
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
            className="bg-[#2a5e84] hover:bg-[#1e4565]"
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