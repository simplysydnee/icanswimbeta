'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, Star, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { priorityBookingService } from '@/lib/priority-booking-service'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { PriorityBookingReason, SwimmerInstructorAssignment } from '@/types/priority-booking'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  is_priority_booking?: boolean
  priority_booking_reason?: PriorityBookingReason | null
  priority_booking_notes?: string | null
  priority_booking_expires_at?: string | null
}

interface Instructor {
  id: string
  full_name: string
  email: string
}

interface PriorityBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimmer: Swimmer | null
  onSave: () => void
}

export function PriorityBookingModal({ open, onOpenChange, swimmer, onSave }: PriorityBookingModalProps) {
  const [isPriority, setIsPriority] = useState(false)
  const [reason, setReason] = useState<PriorityBookingReason>('manual')
  const [notes, setNotes] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | undefined>()
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<SwimmerInstructorAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Load data when modal opens
  useEffect(() => {
    if (open && swimmer) {
      loadData()
    }
  }, [open, swimmer])

  const loadData = async () => {
    if (!swimmer) return
    setLoading(true)

    try {
      // Load all instructors
      const supabase = createClient()
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', (
          await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'instructor')
        ).data?.map(r => r.user_id) || [])

      setAllInstructors(instructors || [])

      // Load current assignments
      const assignments = await priorityBookingService.getAssignedInstructors(swimmer.id)
      setCurrentAssignments(assignments)
      setSelectedInstructors(assignments.map(a => a.instructor_id))

      // Set form values from swimmer
      setIsPriority(swimmer.is_priority_booking || false)
      setReason(swimmer.priority_booking_reason || 'manual')
      setNotes(swimmer.priority_booking_notes || '')
      setExpiresAt(swimmer.priority_booking_expires_at ? new Date(swimmer.priority_booking_expires_at) : undefined)

    } catch (error) {
      console.error('Error loading priority data:', error)
      toast({ title: 'Failed to load priority booking data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!swimmer) return
    setSaving(true)

    try {
      await priorityBookingService.setPriorityBooking({
        swimmerId: swimmer.id,
        isPriority,
        reason: isPriority ? reason : undefined,
        notes: isPriority ? notes : undefined,
        expiresAt: expiresAt?.toISOString() || null,
        instructorIds: isPriority ? selectedInstructors : undefined
      })

      toast({ title: isPriority ? 'Priority booking enabled' : 'Priority booking disabled' })
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving priority booking:', error)
      toast({ title: 'Failed to save priority booking', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleInstructor = (instructorId: string) => {
    setSelectedInstructors(prev =>
      prev.includes(instructorId)
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    )
  }

  if (!swimmer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Priority Booking: {swimmer.first_name} {swimmer.last_name}
          </DialogTitle>
          <DialogDescription>
            Configure priority booking settings for this swimmer.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Priority Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="priority-toggle" className="text-base font-medium">
                  Enable Priority Booking
                </Label>
                <p className="text-sm text-muted-foreground">
                  Restrict this swimmer to assigned instructors only
                </p>
              </div>
              <Switch
                id="priority-toggle"
                checked={isPriority}
                onCheckedChange={setIsPriority}
              />
            </div>

            {isPriority && (
              <>
                {/* Reason */}
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={reason} onValueChange={(v) => setReason(v as PriorityBookingReason)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Assignment</SelectItem>
                      <SelectItem value="attendance">Perfect Attendance</SelectItem>
                      <SelectItem value="medical">Medical/Special Needs</SelectItem>
                      <SelectItem value="behavioral">Behavioral Accommodation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Why does this swimmer need priority booking?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label>Expires (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiresAt ? format(expiresAt, 'PPP') : 'No expiration'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiresAt}
                        onSelect={setExpiresAt}
                        initialFocus
                      />
                      {expiresAt && (
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpiresAt(undefined)}
                            className="w-full"
                          >
                            Clear expiration
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Instructor Selection */}
                <div className="space-y-2">
                  <Label>Assigned Instructors</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    This swimmer can only book with selected instructors
                  </p>

                  {selectedInstructors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedInstructors.map(id => {
                        const instructor = allInstructors.find(i => i.id === id)
                        return instructor ? (
                          <Badge key={id} variant="secondary" className="gap-1">
                            {instructor.full_name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => toggleInstructor(id)}
                            />
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}

                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {allInstructors.map(instructor => (
                      <label
                        key={instructor.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedInstructors.includes(instructor.id)}
                          onCheckedChange={() => toggleInstructor(instructor.id)}
                        />
                        <div>
                          <p className="font-medium">{instructor.full_name}</p>
                          <p className="text-sm text-muted-foreground">{instructor.email}</p>
                        </div>
                      </label>
                    ))}
                    {allInstructors.length === 0 && (
                      <p className="p-3 text-muted-foreground text-center">No instructors found</p>
                    )}
                  </div>

                  {isPriority && selectedInstructors.length === 0 && (
                    <p className="text-sm text-yellow-600">
                      ⚠️ Select at least one instructor for priority booking
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (isPriority && selectedInstructors.length === 0)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}