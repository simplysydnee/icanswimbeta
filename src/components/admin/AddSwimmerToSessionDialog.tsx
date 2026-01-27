'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, User } from 'lucide-react'
import { format } from 'date-fns'

interface Session {
  id: string
  start_time: string
  end_time: string
  location: string | null
  instructor_name?: string
  booking_count: number
  max_capacity: number
  status: string
}

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  parent_id: string
  enrollment_status: string
  payment_type: string
  parent_email?: string
}

interface AddSwimmerToSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  onSuccess: () => void
}

export function AddSwimmerToSessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess
}: AddSwimmerToSessionDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const searchSwimmers = async (query: string) => {
    if (query.length < 2) {
      setSwimmers([])
      return
    }

    setSearching(true)

    const { data, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        parent_id,
        enrollment_status,
        payment_type,
        parent:profiles!parent_id(email)
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .in('enrollment_status', ['enrolled', 'approved', 'pending'])
      .limit(10)

    if (error) {
      console.error('Search error:', error)
      toast({ title: 'Error', description: 'Failed to search swimmers', variant: 'destructive' })
    } else {
      setSwimmers(data?.map(s => ({
        ...s,
        parent_email: s.parent?.email
      })) || [])
    }

    setSearching(false)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setSelectedSwimmer(null)
    searchSwimmers(value)
  }

  const handleSelectSwimmer = (swimmer: Swimmer) => {
    setSelectedSwimmer(swimmer)
    setSwimmers([])
    setSearchQuery(`${swimmer.first_name} ${swimmer.last_name}`)
  }

  const handleConfirm = async () => {
    if (!session || !selectedSwimmer) return

    setSubmitting(true)

    try {
      // 1. Check if swimmer already has a booking for this session
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('session_id', session.id)
        .eq('swimmer_id', selectedSwimmer.id)
        .single()

      if (existingBooking) {
        toast({
          title: 'Already Booked',
          description: `${selectedSwimmer.first_name} is already booked for this session.`,
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      // 2. Check if session is full
      if (session.booking_count >= session.max_capacity) {
        toast({
          title: 'Session Full',
          description: 'This session has reached maximum capacity.',
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      // 3. Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          session_id: session.id,
          swimmer_id: selectedSwimmer.id,
          parent_id: selectedSwimmer.parent_id,
          status: 'confirmed',
          created_at: new Date().toISOString()
        })

      if (bookingError) throw bookingError

      // 4. Update session booking count
      const newBookingCount = session.booking_count + 1
      const isFull = newBookingCount >= session.max_capacity

      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          booking_count: newBookingCount,
          is_full: isFull,
          status: isFull ? 'booked' : session.status
        })
        .eq('id', session.id)

      if (sessionError) throw sessionError

      toast({
        title: 'Swimmer Added',
        description: `${selectedSwimmer.first_name} ${selectedSwimmer.last_name} has been added to the session.`
      })

      // Reset and close
      setSearchQuery('')
      setSelectedSwimmer(null)
      setSwimmers([])
      onOpenChange(false)
      onSuccess()

    } catch (error) {
      console.error('Error adding swimmer:', error)
      toast({
        title: 'Error',
        description: 'Failed to add swimmer to session. Please try again.',
        variant: 'destructive'
      })
    }

    setSubmitting(false)
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedSwimmer(null)
    setSwimmers([])
    onOpenChange(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'private_pay': return 'Private Pay'
      case 'vmrc': return 'VMRC'
      case 'scholarship': return 'Scholarship'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Swimmer to Session</DialogTitle>
          <DialogDescription>
            {session && (
              <>
                {format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')} at{' '}
                {format(new Date(session.start_time), 'h:mm a')}
                {session.location && ` • ${session.location}`}
                {session.instructor_name && ` • ${session.instructor_name}`}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="swimmer-search">Search Swimmer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="swimmer-search"
                placeholder="Type swimmer name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {swimmers.length > 0 && !selectedSwimmer && (
            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
              {swimmers.map((swimmer) => (
                <button
                  key={swimmer.id}
                  onClick={() => handleSelectSwimmer(swimmer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{swimmer.first_name} {swimmer.last_name}</p>
                      <p className="text-sm text-gray-500">{swimmer.parent_email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getStatusColor(swimmer.enrollment_status)}>
                      {swimmer.enrollment_status}
                    </Badge>
                    <Badge variant="secondary">
                      {getPaymentTypeLabel(swimmer.payment_type)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Swimmer Preview */}
          {selectedSwimmer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedSwimmer.first_name} {selectedSwimmer.last_name}</p>
                    <p className="text-sm text-gray-600">{selectedSwimmer.parent_email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSwimmer(null)
                    setSearchQuery('')
                  }}
                >
                  Change
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className={getStatusColor(selectedSwimmer.enrollment_status)}>
                  {selectedSwimmer.enrollment_status}
                </Badge>
                <Badge variant="secondary">
                  {getPaymentTypeLabel(selectedSwimmer.payment_type)}
                </Badge>
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery.length >= 2 && swimmers.length === 0 && !searching && !selectedSwimmer && (
            <p className="text-center text-gray-500 py-4">
              No swimmers found matching "{searchQuery}"
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSwimmer || submitting}
            className="bg-[#2a5e84] hover:bg-[#1e4a6d]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add to Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}