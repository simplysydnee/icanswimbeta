'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Session {
  id: string
  start_time: string
  end_time: string
  location: string | null
  instructor_id: string | null
  status: string
  session_type: string
  max_capacity: number
  booking_count: number
}

interface Instructor {
  id: string
  full_name: string
}

interface EditSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  onSuccess: () => void
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess
}: EditSessionDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [instructorId, setInstructorId] = useState<string>('unassigned')
  const [location, setLocation] = useState<string>('none')
  const [status, setStatus] = useState<string>('')
  const [maxCapacity, setMaxCapacity] = useState<number>(1)

  // Load instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true)
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'instructor')

        if (roleData) {
          const instructorIds = roleData.map(r => r.user_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', instructorIds)
            .eq('is_active', true)
            .order('full_name')

          setInstructors(profiles || [])
        }
      } catch (error) {
        console.error('Error fetching instructors:', error)
        toast({
          title: 'Error',
          description: 'Failed to load instructors',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchInstructors()
    }
  }, [open, supabase, toast])

  // Populate form when session changes
  useEffect(() => {
    if (session) {
      setInstructorId(session.instructor_id || 'unassigned')
      setLocation(session.location || 'none')
      setStatus(session.status)
      setMaxCapacity(session.max_capacity)
    }
  }, [session])

  const handleSave = async () => {
    if (!session) return

    setSubmitting(true)

    try {
      // Validate max capacity
      if (maxCapacity < 1) {
        toast({
          title: 'Invalid Capacity',
          description: 'Maximum capacity must be at least 1.',
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      // Check if new capacity is less than current bookings
      if (maxCapacity < session.booking_count) {
        toast({
          title: 'Invalid Capacity',
          description: `Cannot set capacity to ${maxCapacity} because there are already ${session.booking_count} bookings.`,
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      const { error } = await supabase
        .from('sessions')
        .update({
          instructor_id: instructorId === 'unassigned' ? null : instructorId,
          location: location === 'none' ? null : location,
          status: status,
          max_capacity: maxCapacity,
          updated_at: new Date().toISOString(),
          // Update is_full based on new capacity
          is_full: session.booking_count >= maxCapacity
        })
        .eq('id', session.id)

      if (error) throw error

      toast({
        title: 'Session Updated',
        description: 'The session has been updated successfully.'
      })

      onOpenChange(false)
      onSuccess()

    } catch (error) {
      console.error('Error updating session:', error)
      toast({
        title: 'Error',
        description: 'Failed to update session. Please try again.',
        variant: 'destructive'
      })
    }

    setSubmitting(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            {session && (
              <>
                {format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')} at{' '}
                {format(new Date(session.start_time), 'h:mm a')}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructor */}
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Select value={instructorId} onValueChange={setInstructorId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading instructors..." : "Select instructor"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                <SelectItem value="Modesto">Modesto</SelectItem>
                <SelectItem value="Turlock">Turlock</SelectItem>
                <SelectItem value="Modesto: 1212 Kansas Ave">Modesto: 1212 Kansas Ave</SelectItem>
                <SelectItem value="Turlock: 123 Main St">Turlock: 123 Main St</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="available">Available/Open</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="max-capacity">Max Capacity</Label>
            <div className="flex items-center gap-2">
              <Input
                id="max-capacity"
                type="number"
                min={1}
                max={10}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                Current: {session?.booking_count || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Cannot set capacity lower than current bookings ({session?.booking_count || 0})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || loading}
            className="bg-[#2a5e84] hover:bg-[#1e4a6d]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}