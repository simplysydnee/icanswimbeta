'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import {
  User,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Home,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserX,
  ExternalLink
} from 'lucide-react'
import { Booking } from './types'
import Link from 'next/link'

interface BookingDetailsModalProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingDetailsModal({
  booking,
  open,
  onOpenChange
}: BookingDetailsModalProps) {
  if (!booking) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'no_show':
        return <UserX className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'no_show':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentType = () => {
    if (!booking.swimmer?.funding_source) {
      return 'Private Pay'
    }
    return booking.swimmer.funding_source.type === 'regional_center'
      ? `${booking.swimmer.funding_source.name} (Regional Center)`
      : booking.swimmer.funding_source.type === 'scholarship'
      ? 'Scholarship'
      : 'Private Pay'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking Details
            <Badge className={getStatusColor(booking.status)}>
              {getStatusIcon(booking.status)}
              <span className="ml-1">{booking.status}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Booking ID: {booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Swimmer Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Swimmer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name</span>
                  <Link
                    href={`/admin/swimmers/${booking.swimmer?.id}`}
                    className="text-sm font-medium hover:text-blue-600 flex items-center gap-1"
                  >
                    {booking.swimmer?.first_name} {booking.swimmer?.last_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {booking.swimmer?.date_of_birth && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Date of Birth</span>
                    <span className="text-sm">
                      {format(new Date(booking.swimmer.date_of_birth), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {booking.swimmer?.gender && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gender</span>
                    <span className="text-sm capitalize">{booking.swimmer.gender}</span>
                  </div>
                )}
                {booking.swimmer?.level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Level</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ backgroundColor: `${booking.swimmer.level.color}20` }}
                    >
                      {booking.swimmer.level.display_name}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Type</span>
                  <span className="text-sm">{getPaymentType()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Flexible Swimmer</span>
                  <Badge variant={booking.swimmer?.flexible_swimmer ? "default" : "outline"}>
                    {booking.swimmer?.flexible_swimmer ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {booking.swimmer?.funding_source && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Funding Source</span>
                      <span className="text-sm">{booking.swimmer.funding_source.name}</span>
                    </div>
                    {booking.swimmer.funding_source.contact_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Coordinator</span>
                        <span className="text-sm">{booking.swimmer.funding_source.contact_name}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Parent Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm">{booking.parent?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <Mail className="h-3 w-3 inline mr-1" />
                    Email
                  </span>
                  <span className="text-sm">{booking.parent?.email || 'N/A'}</span>
                </div>
                {booking.parent?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Phone
                    </span>
                    <span className="text-sm">{booking.parent.phone}</span>
                  </div>
                )}
              </div>
              {(booking.parent?.address_line1 || booking.parent?.city) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      <Home className="h-3 w-3 inline mr-1" />
                      Address
                    </span>
                  </div>
                  <div className="text-sm text-right">
                    {booking.parent?.address_line1 && <p>{booking.parent.address_line1}</p>}
                    {booking.parent?.address_line2 && <p>{booking.parent.address_line2}</p>}
                    {(booking.parent?.city || booking.parent?.state || booking.parent?.zip_code) && (
                      <p>
                        {booking.parent?.city}{booking.parent?.city && booking.parent?.state ? ', ' : ''}
                        {booking.parent?.state} {booking.parent?.zip_code}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Session Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Date
                  </span>
                  <span className="text-sm">
                    {booking.session && format(new Date(booking.session.start_time), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Time
                  </span>
                  <span className="text-sm">
                    {booking.session && format(new Date(booking.session.start_time), 'h:mm a')} -{' '}
                    {booking.session && format(new Date(booking.session.end_time), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Location
                  </span>
                  <span className="text-sm">{booking.session?.location || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Instructor</span>
                  <span className="text-sm">{booking.session?.instructor?.full_name || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Type</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {booking.session?.session_type || 'lesson'}
                    {booking.session?.session_type_detail && ` (${booking.session.session_type_detail})`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <DollarSign className="h-3 w-3 inline mr-1" />
                    Booking Type
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {booking.booking_type}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          {(booking.notes || booking.cancel_reason) && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes & History
                </h3>
                <div className="space-y-3">
                  {booking.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Booking Notes</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{booking.notes}</p>
                    </div>
                  )}
                  {booking.cancel_reason && (
                    <div>
                      <p className="text-sm font-medium mb-1">Cancellation Details</p>
                      <div className="text-sm text-gray-600 bg-red-50 p-3 rounded space-y-1">
                        <p><strong>Reason:</strong> {booking.cancel_reason}</p>
                        {booking.canceled_at && (
                          <p><strong>Cancelled at:</strong> {format(new Date(booking.canceled_at), 'MMM d, yyyy h:mm a')}</p>
                        )}
                        {booking.cancel_source && (
                          <p><strong>Cancelled by:</strong> {booking.cancel_source}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {booking.created_at && (
                    <div className="text-xs text-gray-500">
                      Created: {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Progress Notes */}
          {booking.progress_notes && booking.progress_notes.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3">Progress Notes</h3>
                <div className="space-y-3">
                  {booking.progress_notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {note.instructor?.full_name || 'Instructor'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {note.lesson_summary && (
                        <p className="text-sm mb-2"><strong>Summary:</strong> {note.lesson_summary}</p>
                      )}
                      {note.instructor_notes && (
                        <p className="text-sm mb-2"><strong>Instructor Notes:</strong> {note.instructor_notes}</p>
                      )}
                      {note.parent_notes && (
                        <p className="text-sm"><strong>Parent Notes:</strong> {note.parent_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}