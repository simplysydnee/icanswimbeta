'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { Loader2, Calendar, Clock, MapPin, User, Search, Plus } from 'lucide-react'
import { AvailableSession } from './types'
import { useToast } from '@/hooks/use-toast'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  parent_id: string
  parent?: {
    id: string
    full_name: string
    email: string
  }
  funding_source_id?: string
  flexible_swimmer: boolean
}

interface CreateBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: {
    sessionId: string
    swimmerId: string
    parentId: string
    bookingType: 'lesson' | 'assessment' | 'floating'
    notes?: string
  }) => Promise<void>
  availableSessions: AvailableSession[]
  swimmers: Swimmer[]
  loadingSessions?: boolean
  loadingSwimmers?: boolean
  onFetchSessions: (startDate: string, endDate: string) => void
  onFetchSwimmers: (search?: string) => void
}

export function CreateBookingModal({
  open,
  onOpenChange,
  onCreate,
  availableSessions,
  swimmers,
  loadingSessions = false,
  loadingSwimmers = false,
  onFetchSessions,
  onFetchSwimmers
}: CreateBookingModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'swimmer' | 'session' | 'confirm'>('swimmer')
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [bookingType, setBookingType] = useState<'lesson' | 'assessment' | 'floating'>('lesson')
  const [notes, setNotes] = useState('')
  const [swimmerSearch, setSwimmerSearch] = useState('')
  const [creating, setCreating] = useState(false)

  // Group sessions by date
  const sessionsByDate: Record<string, AvailableSession[]> = {}
  availableSessions.forEach(session => {
    const date = new Date(session.start_time).toISOString().split('T')[0]
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = []
    }
    sessionsByDate[date].push(session)
  })

  // Sort dates
  const sortedDates = Object.keys(sessionsByDate).sort()

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      // Load sessions for next 2 weeks
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 14)
      onFetchSessions(startDate.toISOString(), endDate.toISOString())

      // Load swimmers
      onFetchSwimmers()
    }
  }, [open])

  // Filter swimmers based on search
  const filteredSwimmers = swimmers.filter(swimmer =>
    swimmerSearch === '' ||
    swimmer.first_name.toLowerCase().includes(swimmerSearch.toLowerCase()) ||
    swimmer.last_name.toLowerCase().includes(swimmerSearch.toLowerCase()) ||
    swimmer.parent?.full_name.toLowerCase().includes(swimmerSearch.toLowerCase())
  )

  const selectedSwimmer = swimmers.find(s => s.id === selectedSwimmerId)
  const selectedSession = availableSessions.find(s => s.id === selectedSessionId)

  const handleNext = () => {
    if (step === 'swimmer' && selectedSwimmerId) {
      setStep('session')
    } else if (step === 'session' && selectedSessionId) {
      setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'session') {
      setStep('swimmer')
    } else if (step === 'confirm') {
      setStep('session')
    }
  }

  const handleCreate = async () => {
    if (!selectedSwimmer || !selectedSession) return

    setCreating(true)
    try {
      await onCreate({
        sessionId: selectedSessionId,
        swimmerId: selectedSwimmerId,
        parentId: selectedSwimmer.parent_id,
        bookingType,
        notes
      })
      toast({
        title: 'Booking created',
        description: 'Booking has been created successfully.'
      })
      onOpenChange(false)
      // Reset form
      setStep('swimmer')
      setSelectedSwimmerId('')
      setSelectedSessionId('')
      setBookingType('lesson')
      setNotes('')
      setSwimmerSearch('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking.',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Booking
          </DialogTitle>
          <DialogDescription>
            Manually create a booking for a swimmer
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === 'swimmer' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step === 'swimmer' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Swimmer</span>
            </div>
            <div className={`flex items-center ${step === 'session' ? 'text-blue-600' : step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step === 'session' || step === 'confirm' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Select Session</span>
            </div>
            <div className={`flex items-center ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Swimmer */}
        {step === 'swimmer' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Swimmer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by swimmer or parent name..."
                  value={swimmerSearch}
                  onChange={(e) => setSwimmerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loadingSwimmers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredSwimmers.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No swimmers found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {swimmerSearch ? 'Try a different search term' : 'No swimmers available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredSwimmers.map((swimmer) => (
                  <div
                    key={swimmer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSwimmerId === swimmer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedSwimmerId(swimmer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {swimmer.first_name} {swimmer.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Parent: {swimmer.parent?.full_name} • {swimmer.parent?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {swimmer.flexible_swimmer && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Flexible
                          </Badge>
                        )}
                        <div className={`h-4 w-4 rounded-full border ${
                          selectedSwimmerId === swimmer.id
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Session */}
        {step === 'session' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Booking Type</Label>
              <Select value={bookingType} onValueChange={(value: any) => setBookingType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Lesson</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="floating">Floating Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : availableSessions.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No available sessions found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting the date range or check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {sortedDates.map((date) => (
                  <div key={date} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h4 className="font-medium">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </h4>
                    </div>
                    <div className="divide-y">
                      {sessionsByDate[date].map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedSessionId === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {format(new Date(session.start_time), 'h:mm a')} -{' '}
                                  {format(new Date(session.end_time), 'h:mm a')}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {session.session_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span>{session.location}</span>
                                <User className="h-3 w-3" />
                                <span>{session.instructor?.full_name || 'TBD'}</span>
                                <Badge variant="outline" className="text-xs">
                                  {session.max_capacity - session.booking_count} spot{session.max_capacity - session.booking_count !== 1 ? 's' : ''} left
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full border ${
                                selectedSessionId === session.id
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300'
                              }`} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedSwimmer && selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Swimmer Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Swimmer Details</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name</span>
                    <span className="text-sm">
                      {selectedSwimmer.first_name} {selectedSwimmer.last_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Parent</span>
                    <span className="text-sm">{selectedSwimmer.parent?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-sm">{selectedSwimmer.parent?.email}</span>
                  </div>
                  {selectedSwimmer.flexible_swimmer && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                        Flexible Swimmer
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Session Details</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Date</span>
                    <span className="text-sm">
                      {format(new Date(selectedSession.start_time), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Time</span>
                    <span className="text-sm">
                      {format(new Date(selectedSession.start_time), 'h:mm a')} -{' '}
                      {format(new Date(selectedSession.end_time), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location</span>
                    <span className="text-sm">{selectedSession.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Instructor</span>
                    <span className="text-sm">{selectedSession.instructor?.full_name || 'TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Booking Type</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {bookingType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this booking..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            {step !== 'swimmer' && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step !== 'confirm' ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 'swimmer' && !selectedSwimmerId) ||
                    (step === 'session' && !selectedSessionId)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}