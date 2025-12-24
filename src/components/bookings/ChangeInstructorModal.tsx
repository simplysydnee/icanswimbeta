'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2, UserCog, Calendar } from 'lucide-react'
import { Booking } from './types'
import { useToast } from '@/hooks/use-toast'

interface ChangeInstructorModalProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bookingId: string, instructorId: string, reason?: string, applyToFuture?: boolean) => Promise<void>
  instructors: Array<{ id: string; full_name: string }>
}

export function ChangeInstructorModal({
  booking,
  open,
  onOpenChange,
  onSave,
  instructors
}: ChangeInstructorModalProps) {
  const { toast } = useToast()
  const [instructorId, setInstructorId] = useState('')
  const [reason, setReason] = useState('')
  const [applyToFuture, setApplyToFuture] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!booking || !instructorId) return

    setSaving(true)
    try {
      await onSave(booking.id, instructorId, reason, applyToFuture)
      toast({
        title: 'Instructor changed',
        description: 'Instructor has been updated successfully.'
      })
      onOpenChange(false)
      // Reset form
      setInstructorId('')
      setReason('')
      setApplyToFuture(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change instructor.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!booking) return null

  const currentInstructor = booking.session?.instructor?.full_name || 'TBD'
  const selectedInstructor = instructors.find(i => i.id === instructorId)?.full_name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Change Instructor
          </DialogTitle>
          <DialogDescription>
            Assign a new instructor for {booking.swimmer?.first_name}'s booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Booking Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Instructor</span>
              <Badge variant="outline">{currentInstructor}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Session Date</span>
              <span>
                {booking.session && format(new Date(booking.session.start_time), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Time</span>
              <span>
                {booking.session && format(new Date(booking.session.start_time), 'h:mm a')}
              </span>
            </div>
          </div>

          {/* New Instructor */}
          <div className="space-y-2">
            <Label htmlFor="instructor">New Instructor *</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Instructor call-out, schedule change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Apply to Future Sessions */}
          {booking.booking_type === 'lesson' && (
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="applyToFuture"
                checked={applyToFuture}
                onCheckedChange={(checked) => setApplyToFuture(checked as boolean)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="applyToFuture" className="font-medium cursor-pointer">
                  Apply to all future sessions
                </Label>
                <p className="text-xs text-gray-600">
                  This will change the instructor for all future recurring sessions
                  for {booking.swimmer?.first_name} {booking.swimmer?.last_name}.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedInstructor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800">Change Preview</p>
              <p className="text-xs text-blue-700 mt-1">
                Changing instructor from <strong>{currentInstructor}</strong> to{' '}
                <strong>{selectedInstructor}</strong>
                {applyToFuture && ' for all future sessions'}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!instructorId || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <UserCog className="h-4 w-4 mr-2" />
            Change Instructor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}