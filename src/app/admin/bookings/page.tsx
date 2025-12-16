'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { format, isBefore } from 'date-fns'
import {
  Calendar,
  Clock,
  Loader2,
  Search,
  XCircle,
  AlertTriangle,
  User,
  Filter
} from 'lucide-react'

interface Booking {
  id: string
  status: string
  booking_type: string
  created_at: string
  canceled_at: string | null
  cancel_reason: string | null
  session: {
    id: string
    start_time: string
    end_time: string
    location: string
    instructor: {
      id: string
      full_name: string
    } | null
  } | null
  swimmer: {
    id: string
    first_name: string
    last_name: string
    funding_source_id: string | null
    flexible_swimmer: boolean
  } | null
  parent: {
    id: string
    full_name: string
    email: string
  } | null
}

interface FundingSource {
  id: string
  type: string
}

export default function AdminBookingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('confirmed')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [markAsFlexible, setMarkAsFlexible] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          booking_type,
          created_at,
          canceled_at,
          cancel_reason,
          session:sessions (
            id,
            start_time,
            end_time,
            location,
            instructor:profiles!instructor_id (
              id,
              full_name
            )
          ),
          swimmer:swimmers (
            id,
            first_name,
            last_name,
            funding_source_id,
            flexible_swimmer
          ),
          parent:profiles!parent_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      const dataArray = (data as unknown) as unknown[]
      const validBookings = (dataArray || []).filter(
        (b: unknown) => {
          const booking = b as Booking
          return booking.session !== null && booking.swimmer !== null
        }
      ) as Booking[]
      setBookings(validBookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchFundingSources = async () => {
    try {
      const { data, error } = await supabase
        .from('funding_sources')
        .select('*')
        .order('name')

      if (error) throw error
      setFundingSources(data || [])
    } catch (error) {
      console.error('Error fetching funding sources:', error)
    }
  }

  useEffect(() => {
    fetchBookings()
    fetchFundingSources()
  }, [statusFilter])

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    // These should not be null due to earlier filtering, but check anyway
    if (!booking.swimmer || !booking.session) return false
    return (
      booking.swimmer.first_name.toLowerCase().includes(search) ||
      booking.swimmer.last_name.toLowerCase().includes(search) ||
      booking.parent?.full_name?.toLowerCase().includes(search) ||
      booking.parent?.email?.toLowerCase().includes(search) ||
      booking.session.instructor?.full_name?.toLowerCase().includes(search)
    )
  })

  const getHoursUntilSession = (startTime: string): number => {
    const sessionStart = new Date(startTime)
    const now = new Date()
    return (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)
  }

  const isRegionalCenterClient = (fundingSourceId: string | null): boolean => {
    if (!fundingSourceId) return false
    const fundingSource = fundingSources.find(fs => fs.id === fundingSourceId)
    return fundingSource?.type === 'regional_center'
  }

  const isLateCancel = (startTime: string): boolean => {
    return getHoursUntilSession(startTime) < 24
  }

  const isPastSession = (startTime: string): boolean => {
    return isBefore(new Date(startTime), new Date())
  }

  const openCancelDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancelReason('')
    setAdminNotes('')
    if (booking.session) {
      setMarkAsFlexible(isLateCancel(booking.session.start_time))
    }
    setShowCancelDialog(true)
  }

  const handleCancel = async () => {
    if (!selectedBooking) return

    setCanceling(true)
    try {
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          adminNotes: adminNotes,
          markAsFlexibleSwimmer: markAsFlexible,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking')
      }

      toast({
        title: 'Booking Cancelled ✓',
        description: markAsFlexible && selectedBooking.swimmer
          ? `Booking cancelled and ${selectedBooking.swimmer.first_name} marked as flexible swimmer.`
          : 'Booking cancelled successfully.',
      })

      setShowCancelDialog(false)
      setSelectedBooking(null)
      setCancelReason('')
      setAdminNotes('')
      setMarkAsFlexible(false)
      fetchBookings()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: 'Cancel Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCanceling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600">View, search, and cancel bookings</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by swimmer, parent, or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bookings</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Swimmer</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      if (!booking.session || !booking.swimmer) return null
                      const hoursUntil = getHoursUntilSession(booking.session.start_time)
                      const isPast = isPastSession(booking.session.start_time)
                      const isLate = isLateCancel(booking.session.start_time)

                      return (
                        <TableRow key={booking.id} className={isPast ? 'opacity-60' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {booking.swimmer.first_name} {booking.swimmer.last_name}
                              </p>
                              <div className="flex gap-1 mt-1">
                                {isRegionalCenterClient(booking.swimmer.funding_source_id) && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Regional Center</Badge>
                                )}
                                {booking.swimmer.flexible_swimmer && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Flexible</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{booking.parent?.full_name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{booking.parent?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm">{format(new Date(booking.session.start_time), 'MMM d, yyyy')}</p>
                                <p className="text-xs text-gray-500">{format(new Date(booking.session.start_time), 'h:mm a')}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{booking.session.instructor?.full_name || 'TBD'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {booking.booking_type || 'lesson'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                            {booking.status === 'confirmed' && !isPast && isLate && (
                              <p className="text-xs text-amber-600 mt-1">
                                {Math.round(hoursUntil)}h until session
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status === 'confirmed' && !isPast && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openCancelDialog(booking)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {booking.status === 'cancelled' && (
                              <span className="text-xs text-gray-400">
                                {booking.cancel_reason || 'No reason given'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Booking (Admin)</DialogTitle>
              <DialogDescription>
                Cancel this booking and optionally mark the swimmer as flexible.
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="py-4 space-y-4">
                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {selectedBooking.swimmer?.first_name} {selectedBooking.swimmer?.last_name}
                    </span>
                    {selectedBooking && selectedBooking.swimmer && isRegionalCenterClient(selectedBooking.swimmer.funding_source_id) && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Regional Center</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{selectedBooking.session && format(new Date(selectedBooking.session.start_time), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{selectedBooking.session && format(new Date(selectedBooking.session.start_time), 'h:mm a')}</span>
                  </div>
                  <p className="text-gray-500">Parent: {selectedBooking.parent?.full_name}</p>
                </div>

                {/* Late Cancel Warning */}
                {selectedBooking.session && isLateCancel(selectedBooking.session.start_time) && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Late Cancellation</p>
                      <p className="text-xs text-amber-700">
                        This session is less than 24 hours away ({Math.round(getHoursUntilSession(selectedBooking.session.start_time))} hours remaining).
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancel Reason */}
                <div>
                  <Label htmlFor="cancel_reason">Reason for cancellation</Label>
                  <Textarea
                    id="cancel_reason"
                    placeholder="Why is this being cancelled?"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="admin_notes">Admin Notes (internal only)</Label>
                  <Textarea
                    id="admin_notes"
                    placeholder="Any internal notes about this cancellation..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Flexible Swimmer Checkbox */}
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50/50">
                  <Checkbox
                    id="markFlexible"
                    checked={markAsFlexible}
                    onCheckedChange={(checked) => setMarkAsFlexible(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="markFlexible" className="font-medium cursor-pointer">
                      Mark as Flexible Swimmer
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Flexible swimmers cannot book recurring lessons and can only book single/floating sessions.
                    </p>
                    {selectedBooking.swimmer?.flexible_swimmer && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠️ This swimmer is already marked as flexible.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false)
                  setSelectedBooking(null)
                }}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cancel Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}