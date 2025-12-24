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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, isSameDay } from 'date-fns'
import { Loader2, Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react'
import { Booking, AvailableSession } from './types'
import { useToast } from '@/hooks/use-toast'

interface RescheduleModalProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReschedule: (bookingId: string, newSessionId: string, notifyParent: boolean) => Promise<void>
  availableSessions: AvailableSession[]
  loadingSessions?: boolean
  onFetchSessions: (startDate: string, endDate: string) => void
}

export function RescheduleModal({
  booking,
  open,
  onOpenChange,
  onReschedule,
  availableSessions,
  loadingSessions = false,
  onFetchSessions
}: RescheduleModalProps) {
  const { toast } = useToast()
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [notifyParent, setNotifyParent] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

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

  // Load available sessions when modal opens
  useEffect(() => {
    if (open && booking?.session?.start_time) {
      const startDate = new Date(booking.session.start_time)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 14) // Look 2 weeks ahead

      onFetchSessions(startDate.toISOString(), endDate.toISOString())
    }
  }, [open, booking])

  const handleReschedule = async () => {
    if (!booking || !selectedSessionId) return

    setSaving(true)
    try {
      await onReschedule(booking.id, selectedSessionId, notifyParent)
      toast({
        title: 'Booking rescheduled',
        description: 'Booking has been rescheduled successfully.'
      })
      onOpenChange(false)
      // Reset form
      setSelectedSessionId('')
      setNotifyParent(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule booking.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!booking) return null

  const currentSession = booking.session
  const selectedSession = availableSessions.find(s => s.id === selectedSessionId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reschedule Booking
          </DialogTitle>
          <DialogDescription>
            Select a new session time for {booking.swimmer?.first_name} {booking.swimmer?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Session */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Current Booking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {currentSession && format(new Date(currentSession.start_time), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {currentSession && format(new Date(currentSession.start_time), 'h:mm a')} -{' '}
                    {currentSession && format(new Date(currentSession.end_time), 'h:mm a')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{currentSession?.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{currentSession?.instructor?.full_name || 'TBD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Available Sessions</h3>
              <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
                <TabsList className="h-8">
                  <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
                </TabsList>
              </Tabs>
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
            ) : view === 'calendar' ? (
              // Calendar View
              <div className="space-y-4">
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
            ) : (
              // List View
              <div className="space-y-2">
                {availableSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors ${
                      selectedSessionId === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {format(new Date(session.start_time), 'MMM d, yyyy')}
                          </span>
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {format(new Date(session.start_time), 'h:mm a')} -{' '}
                            {format(new Date(session.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{session.location}</span>
                          <User className="h-3 w-3" />
                          <span>{session.instructor?.full_name || 'TBD'}</span>
                          <Badge variant="outline" className="text-xs">
                            {session.session_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {session.max_capacity - session.booking_count} spot{session.max_capacity - session.booking_count !== 1 ? 's' : ''} left
                          </Badge>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border ${
                        selectedSessionId === session.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Session Preview */}
          {selectedSession && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Selected Session</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {format(new Date(selectedSession.start_time), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {format(new Date(selectedSession.start_time), 'h:mm a')} -{' '}
                      {format(new Date(selectedSession.end_time), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{selectedSession.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{selectedSession.instructor?.full_name || 'TBD'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notify Parent */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="notifyParent"
              checked={notifyParent}
              onCheckedChange={(checked) => setNotifyParent(checked as boolean)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="notifyParent" className="font-medium cursor-pointer">
                Notify parent about reschedule
              </Label>
              <p className="text-xs text-gray-600">
                Send an email notification to {booking.parent?.full_name} ({booking.parent?.email})
                about the schedule change.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedSessionId || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Calendar className="h-4 w-4 mr-2" />
            Reschedule Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}