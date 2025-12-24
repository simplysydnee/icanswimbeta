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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2, XCircle, AlertTriangle, Mail } from 'lucide-react'
import { Booking } from './types'
import { useToast } from '@/hooks/use-toast'

interface CancelBookingModalProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: (bookingId: string, reason: string, notes?: string, markFlexible?: boolean, notifyParent?: boolean) => Promise<void>
}

const CANCEL_REASONS = [
  'Swimmer request',
  'Instructor unavailable',
  'Weather',
  'Pool maintenance',
  'Swimmer illness',
  'Other'
]

export function CancelBookingModal({
  booking,
  open,
  onOpenChange,
  onCancel
}: CancelBookingModalProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [markFlexible, setMarkFlexible] = useState(false)
  const [notifyParent, setNotifyParent] = useState(true)
  const [canceling, setCanceling] = useState(false)

  const isLateCancel = () => {
    if (!booking?.session?.start_time) return false
    const sessionStart = new Date(booking.session.start_time)
    const now = new Date()
    const hoursUntil = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntil < 24
  }

  const handleCancel = async () => {
    if (!booking || !reason) return

    setCanceling(true)
    try {
      await onCancel(booking.id, reason, notes, markFlexible, notifyParent)
      toast({
        title: 'Booking cancelled',
        description: 'Booking has been cancelled successfully.'
      })
      onOpenChange(false)
      // Reset form
      setReason('')
      setNotes('')
      setMarkFlexible(false)
      setNotifyParent(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking.',
        variant: 'destructive'
      })
    } finally {
      setCanceling(false)
    }
  }

  if (!booking) return null

  const lateCancel = isLateCancel()
  const isFlexibleSwimmer = booking.swimmer?.flexible_swimmer

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Cancel booking for {booking.swimmer?.first_name} {booking.swimmer?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Details */}
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
            <div className="flex items-center justify-between">
              <span className="font-medium">Parent</span>
              <span>{booking.parent?.full_name}</span>
            </div>
          </div>

          {/* Late Cancel Warning */}
          {lateCancel && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Late Cancellation</p>
                <p className="text-xs text-amber-700">
                  This session is less than 24 hours away. Late cancellations may affect
                  swimmer status and future booking eligibility.
                </p>
              </div>
            </div>
          )}

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((cancelReason) => (
                  <SelectItem key={cancelReason} value={cancelReason}>
                    {cancelReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this cancellation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Flexible Swimmer Checkbox */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="markFlexible"
              checked={markFlexible}
              onCheckedChange={(checked) => setMarkFlexible(checked as boolean)}
              className="mt-0.5"
              disabled={isFlexibleSwimmer}
            />
            <div className="space-y-1">
              <Label htmlFor="markFlexible" className="font-medium cursor-pointer">
                Mark as Flexible Swimmer
              </Label>
              <p className="text-xs text-gray-600">
                Flexible swimmers cannot book recurring lessons and can only book single/floating sessions.
                {isFlexibleSwimmer && (
                  <span className="text-amber-600 font-medium block mt-1">
                    ⚠️ This swimmer is already marked as flexible.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Notify Parent Checkbox */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="notifyParent"
              checked={notifyParent}
              onCheckedChange={(checked) => setNotifyParent(checked as boolean)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="notifyParent" className="font-medium cursor-pointer">
                <Mail className="h-3 w-3 inline mr-1" />
                Notify parent by email
              </Label>
              <p className="text-xs text-gray-600">
                Send cancellation notification to {booking.parent?.full_name} ({booking.parent?.email})
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason || canceling}
          >
            {canceling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}