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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Booking } from './types'
import { useToast } from '@/hooks/use-toast'

interface EditBookingModalProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bookingId: string, updates: { status?: string; notes?: string }) => Promise<void>
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-Show' }
]

export function EditBookingModal({
  booking,
  open,
  onOpenChange,
  onSave
}: EditBookingModalProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState(booking?.status || 'confirmed')
  const [notes, setNotes] = useState(booking?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!booking) return

    setSaving(true)
    try {
      await onSave(booking.id, { status, notes })
      toast({
        title: 'Booking updated',
        description: 'Booking has been updated successfully.'
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking details for {booking.swimmer?.first_name} {booking.swimmer?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
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
            <div className="flex items-center justify-between">
              <span className="font-medium">Instructor</span>
              <span>{booking.session?.instructor?.full_name || 'TBD'}</span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          option.value === 'confirmed' ? 'bg-green-100 text-green-700' :
                          option.value === 'completed' ? 'bg-blue-100 text-blue-700' :
                          option.value === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add or update booking notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              These notes are visible to administrators only.
            </p>
          </div>

          {/* Warning for status changes */}
          {status !== booking.status && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800">Status Change</p>
              <p className="text-xs text-amber-700 mt-1">
                Changing status from <strong>{booking.status}</strong> to <strong>{status}</strong> may
                affect session availability and notifications.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}