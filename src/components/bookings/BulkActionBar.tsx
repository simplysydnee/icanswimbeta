'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import {
  XCircle,
  UserCog,
  CheckCircle,
  UserX,
  Download,
  MoreVertical,
  AlertTriangle
} from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onCancel: (reason: string, notes?: string) => void
  onChangeInstructor: (instructorId: string, reason?: string) => void
  onMarkCompleted: (notes?: string) => void
  onMarkNoShow: (notes?: string) => void
  onExport: () => void
  instructors: Array<{ id: string; full_name: string }>
}

const CANCEL_REASONS = [
  'Swimmer request',
  'Instructor unavailable',
  'Weather',
  'Pool maintenance',
  'Swimmer illness',
  'Other'
]

export function BulkActionBar({
  selectedCount,
  onCancel,
  onChangeInstructor,
  onMarkCompleted,
  onMarkNoShow,
  onExport,
  instructors
}: BulkActionBarProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showInstructorDialog, setShowInstructorDialog] = useState(false)
  const [showCompletedDialog, setShowCompletedDialog] = useState(false)
  const [showNoShowDialog, setShowNoShowDialog] = useState(false)

  const [cancelReason, setCancelReason] = useState('')
  const [cancelNotes, setCancelNotes] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [instructorReason, setInstructorReason] = useState('')
  const [completedNotes, setCompletedNotes] = useState('')
  const [noShowNotes, setNoShowNotes] = useState('')

  const handleCancel = () => {
    if (!cancelReason) return
    onCancel(cancelReason, cancelNotes)
    setShowCancelDialog(false)
    setCancelReason('')
    setCancelNotes('')
  }

  const handleChangeInstructor = () => {
    if (!selectedInstructor) return
    onChangeInstructor(selectedInstructor, instructorReason)
    setShowInstructorDialog(false)
    setSelectedInstructor('')
    setInstructorReason('')
  }

  const handleMarkCompleted = () => {
    onMarkCompleted(completedNotes)
    setShowCompletedDialog(false)
    setCompletedNotes('')
  }

  const handleMarkNoShow = () => {
    onMarkNoShow(noShowNotes)
    setShowNoShowDialog(false)
    setNoShowNotes('')
  }

  return (
    <>
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {selectedCount} selected
              </Badge>
              <p className="text-sm text-gray-600">
                Select an action to apply to all selected bookings
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Selected
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowInstructorDialog(true)}>
                    <UserCog className="h-4 w-4 mr-2" />
                    Change Instructor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCompletedDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNoShowDialog(true)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark as No-Show
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {selectedCount} Bookings</DialogTitle>
            <DialogDescription>
              This will cancel all selected bookings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Warning</p>
                <p className="text-xs text-amber-700">
                  You are about to cancel {selectedCount} booking{selectedCount > 1 ? 's' : ''}.
                  This will notify parents and update session availability.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel_reason">Cancel Reason *</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel_notes">Notes (optional)</Label>
              <Textarea
                id="cancel_notes"
                placeholder="Add any additional notes about this cancellation..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Bookings
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel {selectedCount} Booking{selectedCount > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Instructor Dialog */}
      <Dialog open={showInstructorDialog} onOpenChange={setShowInstructorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Instructor for {selectedCount} Bookings</DialogTitle>
            <DialogDescription>
              Select a new instructor for all selected bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">New Instructor *</Label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
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

            <div className="space-y-2">
              <Label htmlFor="instructor_reason">Reason (optional)</Label>
              <Input
                id="instructor_reason"
                placeholder="e.g., Instructor call-out, schedule change..."
                value={instructorReason}
                onChange={(e) => setInstructorReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstructorDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangeInstructor}
              disabled={!selectedInstructor}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Change Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Completed Dialog */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark {selectedCount} Bookings as Completed</DialogTitle>
            <DialogDescription>
              This will mark all selected bookings as completed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="completed_notes">Notes (optional)</Label>
              <Textarea
                id="completed_notes"
                placeholder="Add any notes about these completed sessions..."
                value={completedNotes}
                onChange={(e) => setCompletedNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkCompleted}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark No-Show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark {selectedCount} Bookings as No-Show</DialogTitle>
            <DialogDescription>
              This will mark all selected bookings as no-shows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Important</p>
                <p className="text-xs text-red-700">
                  Marking as no-show may affect swimmer status and future booking eligibility.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_show_notes">Notes (optional)</Label>
              <Textarea
                id="no_show_notes"
                placeholder="Add any notes about these no-shows..."
                value={noShowNotes}
                onChange={(e) => setNoShowNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkNoShow}
            >
              <UserX className="h-4 w-4 mr-2" />
              Mark as No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}