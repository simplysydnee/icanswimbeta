'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Import booking components
import { BookingSummaryStats } from '@/components/bookings/BookingSummaryStats'
import { BookingFilters } from '@/components/bookings/BookingFilters'
import { ViewToggle } from '@/components/bookings/ViewToggle'
import { BulkActionBar } from '@/components/bookings/BulkActionBar'
import { BookingTable } from '@/components/bookings/BookingTable'
import { BookingCalendarView } from '@/components/bookings/BookingCalendarView'
import { BookingDetailsModal } from '@/components/bookings/BookingDetailsModal'
import { EditBookingModal } from '@/components/bookings/EditBookingModal'
import { ChangeInstructorModal } from '@/components/bookings/ChangeInstructorModal'
import { RescheduleModal } from '@/components/bookings/RescheduleModal'
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal'
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal'

// Import types
import { Booking, BookingFilters as BookingFiltersType, AvailableSession } from '@/components/bookings/types'

interface Instructor {
  id: string
  full_name: string
}

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

export default function AdminBookingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    open_sessions: 0,
    booked: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_shows: 0
  })
  const [loading, setLoading] = useState(true)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingSwimmers, setLoadingSwimmers] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // UI State
  const [view, setView] = useState<'table' | 'calendar'>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState<BookingFiltersType>({})
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInstructorModal, setShowInstructorModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Fetch bookings with filters
  const fetchBookings = useCallback(async (filters: BookingFiltersType = {}) => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams()

      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.instructorId) params.append('instructorId', filters.instructorId)
      if (filters.status) params.append('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status)
      if (filters.paymentType) params.append('paymentType', filters.paymentType)
      if (filters.search) params.append('search', filters.search)
      if (filters.bookingType) params.append('bookingType', filters.bookingType)
      if (filters.location) params.append('location', filters.location)

      const response = await fetch(`/api/bookings?${params.toString()}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      setFilteredBookings(data.bookings || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load bookings'
      setFetchError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      // Clear bookings on error
      setFilteredBookings([])
    } finally {
      setLoading(false)
    }
  }, [toast, stats])

  // Fetch instructors
  const fetchInstructors = useCallback(async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profile:profiles(id, full_name)
        `)
        .eq('role', 'instructor')
        .order('profile(full_name)', { ascending: true })

      if (roleError) throw roleError

      const instructorList = roleData
        ?.map(r => {
          // Handle case where profile might be an array
          const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
          return profile;
        })
        .filter(Boolean) || [];

      setInstructors(instructorList.map(profile => ({
        id: profile.id,
        full_name: profile.full_name
      })) || [])
    } catch (error) {
      console.error('Error fetching instructors:', error)
    }
  }, [supabase])

  // Fetch swimmers for create modal
  const fetchSwimmers = useCallback(async (search?: string) => {
    setLoadingSwimmers(true)
    try {
      let query = supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          parent_id,
          funding_source_id,
          flexible_swimmer,
          parent:profiles!parent_id (
            id,
            full_name,
            email
          )
        `)
        .eq('enrollment_status', 'enrolled')
        .order('first_name')

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,profiles!parent_id.full_name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setSwimmers(data || [])
    } catch (error) {
      console.error('Error fetching swimmers:', error)
    } finally {
      setLoadingSwimmers(false)
    }
  }, [supabase])

  // Fetch available sessions for reschedule/create
  const fetchAvailableSessions = useCallback(async (startDate: string, endDate: string) => {
    setLoadingSessions(true)
    try {
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const response = await fetch(`/api/sessions/available?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch available sessions')

      const data = await response.json()
      setAvailableSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching available sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchBookings()
    fetchInstructors()
  }, [fetchBookings, fetchInstructors])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: BookingFiltersType) => {
    setFilters(newFilters)
    fetchBookings(newFilters)
  }, [fetchBookings])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    fetchBookings({})
  }, [fetchBookings])

  // Selection handlers
  const handleSelectChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBookings.map(booking => booking.id))
    } else {
      setSelectedIds([])
    }
  }

  // Action handlers
  const handleAction = (action: string, booking: Booking) => {
    setSelectedBooking(booking)

    switch (action) {
      case 'view_details':
        setShowDetailsModal(true)
        break
      case 'edit':
        setShowEditModal(true)
        break
      case 'change_instructor':
        setShowInstructorModal(true)
        break
      case 'reschedule':
        setShowRescheduleModal(true)
        break
      case 'cancel':
        setShowCancelModal(true)
        break
      case 'mark_completed':
        handleMarkCompleted([booking.id])
        break
      case 'mark_no_show':
        handleMarkNoShow([booking.id])
        break
      case 'delete':
        handleDeleteBooking(booking.id)
        break
    }
  }

  // Bulk actions
  const handleBulkCancel = async (reason: string, notes?: string) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          bookingIds: selectedIds,
          data: { reason, notes }
        })
      })

      if (!response.ok) throw new Error('Failed to cancel bookings')

      toast({
        title: 'Success',
        description: `${selectedIds.length} bookings cancelled`
      })

      setSelectedIds([])
      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel bookings',
        variant: 'destructive'
      })
    }
  }

  const handleBulkChangeInstructor = async (instructorId: string, reason?: string) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_instructor',
          bookingIds: selectedIds,
          data: { instructorId, reason }
        })
      })

      if (!response.ok) throw new Error('Failed to change instructor')

      toast({
        title: 'Success',
        description: `Instructor changed for ${selectedIds.length} bookings`
      })

      setSelectedIds([])
      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change instructor',
        variant: 'destructive'
      })
    }
  }

  const handleBulkMarkCompleted = async (notes?: string) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_completed',
          bookingIds: selectedIds,
          data: { notes }
        })
      })

      if (!response.ok) throw new Error('Failed to mark bookings as completed')

      toast({
        title: 'Success',
        description: `${selectedIds.length} bookings marked as completed`
      })

      setSelectedIds([])
      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark bookings as completed',
        variant: 'destructive'
      })
    }
  }

  const handleBulkMarkNoShow = async (notes?: string) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_no_show',
          bookingIds: selectedIds,
          data: { notes }
        })
      })

      if (!response.ok) throw new Error('Failed to mark bookings as no-show')

      toast({
        title: 'Success',
        description: `${selectedIds.length} bookings marked as no-show`
      })

      setSelectedIds([])
      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark bookings as no-show',
        variant: 'destructive'
      })
    }
  }

  const handleBulkExport = () => {
    // Simple CSV export
    const headers = ['Swimmer', 'Parent', 'Session Date', 'Time', 'Instructor', 'Type', 'Payment', 'Status']
    const csvData = filteredBookings
      .filter(booking => selectedIds.includes(booking.id))
      .map(booking => [
        `${booking.swimmer?.first_name} ${booking.swimmer?.last_name}`,
        booking.parent?.full_name || '',
        booking.session ? format(new Date(booking.session.start_time), 'MM/dd/yyyy') : '',
        booking.session ? format(new Date(booking.session.start_time), 'h:mm a') : '',
        booking.session?.instructor?.full_name || 'TBD',
        booking.booking_type,
        booking.swimmer?.funding_source ? 'Regional Center' : 'Private Pay',
        booking.status
      ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Exported',
      description: `${selectedIds.length} bookings exported to CSV`
    })
  }

  // Single booking actions
  const handleUpdateBooking = async (bookingId: string, updates: { status?: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update booking')

      toast({
        title: 'Success',
        description: 'Booking updated successfully'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleChangeInstructor = async (bookingId: string, instructorId: string, reason?: string, applyToFuture?: boolean) => {
    try {
      // This would need a dedicated API endpoint for single booking instructor change
      const response = await fetch(`/api/bookings/${bookingId}/instructor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, reason, applyToFuture })
      })

      if (!response.ok) throw new Error('Failed to change instructor')

      toast({
        title: 'Success',
        description: 'Instructor changed successfully'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change instructor',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleReschedule = async (bookingId: string, newSessionId: string, notifyParent: boolean) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSessionId, notifyParent })
      })

      if (!response.ok) throw new Error('Failed to reschedule booking')

      toast({
        title: 'Success',
        description: 'Booking rescheduled successfully'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule booking',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleCancelBooking = async (bookingId: string, reason: string, notes?: string, markFlexible?: boolean, notifyParent?: boolean) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes, markFlexible, notifyParent })
      })

      if (!response.ok) throw new Error('Failed to cancel booking')

      toast({
        title: 'Success',
        description: 'Booking cancelled successfully'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleCreateBooking = async (data: {
    sessionId: string
    swimmerId: string
    parentId: string
    bookingType: 'lesson' | 'assessment' | 'floating'
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create booking')

      toast({
        title: 'Success',
        description: 'Booking created successfully'
      })

      setShowCreateModal(false)
      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleMarkCompleted = async (bookingIds: string[]) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_completed',
          bookingIds,
          data: {}
        })
      })

      if (!response.ok) throw new Error('Failed to mark booking as completed')

      toast({
        title: 'Success',
        description: 'Booking marked as completed'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark booking as completed',
        variant: 'destructive'
      })
    }
  }

  const handleMarkNoShow = async (bookingIds: string[]) => {
    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_no_show',
          bookingIds,
          data: {}
        })
      })

      if (!response.ok) throw new Error('Failed to mark booking as no-show')

      toast({
        title: 'Success',
        description: 'Booking marked as no-show'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark booking as no-show',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete booking')

      toast({
        title: 'Success',
        description: 'Booking deleted successfully'
      })

      fetchBookings(filters)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive'
      })
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
            <p className="text-gray-600">View, manage, and create bookings</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>

        {/* Summary Stats */}
        <BookingSummaryStats stats={stats} loading={loading} />

        {/* Filters */}
        <BookingFilters
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          instructors={instructors}
          loading={loading}
        />

        {/* View Toggle */}
        <ViewToggle view={view} onViewChange={setView} />

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.length}
            onCancel={handleBulkCancel}
            onChangeInstructor={handleBulkChangeInstructor}
            onMarkCompleted={handleBulkMarkCompleted}
            onMarkNoShow={handleBulkMarkNoShow}
            onExport={handleBulkExport}
            instructors={instructors}
          />
        )}

        {/* Error Display */}
        {fetchError && !loading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{fetchError}</p>
              </div>
              <Button
                onClick={() => fetchBookings(filters)}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Bookings View */}
        {view === 'table' ? (
          <BookingTable
            bookings={filteredBookings}
            selectedIds={selectedIds}
            onSelectChange={handleSelectChange}
            onSelectAll={handleSelectAll}
            onAction={handleAction}
            loading={loading}
          />
        ) : (
          <BookingCalendarView bookings={filteredBookings} />
        )}

        {/* Modals */}
        <BookingDetailsModal
          booking={selectedBooking}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />

        <EditBookingModal
          booking={selectedBooking}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleUpdateBooking}
        />

        <ChangeInstructorModal
          booking={selectedBooking}
          open={showInstructorModal}
          onOpenChange={setShowInstructorModal}
          onSave={handleChangeInstructor}
          instructors={instructors}
        />

        <RescheduleModal
          booking={selectedBooking}
          open={showRescheduleModal}
          onOpenChange={setShowRescheduleModal}
          onReschedule={handleReschedule}
          availableSessions={availableSessions}
          loadingSessions={loadingSessions}
          onFetchSessions={fetchAvailableSessions}
        />

        <CancelBookingModal
          booking={selectedBooking}
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          onCancel={handleCancelBooking}
        />

        <CreateBookingModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreate={handleCreateBooking}
          availableSessions={availableSessions}
          swimmers={swimmers}
          loadingSessions={loadingSessions}
          loadingSwimmers={loadingSwimmers}
          onFetchSessions={fetchAvailableSessions}
          onFetchSwimmers={fetchSwimmers}
        />
      </div>
    </RoleGuard>
  )
}