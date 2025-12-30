'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import {
  MoreVertical,
  Eye,
  Edit,
  UserCog,
  Calendar,
  XCircle,
  CheckCircle,
  UserX,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { Booking } from './types'
import Link from 'next/link'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { BookingCard } from './BookingCard'

interface BookingTableProps {
  bookings: Booking[]
  selectedIds: string[]
  onSelectChange: (id: string) => void
  onSelectAll: (checked: boolean) => void
  onAction: (action: string, booking: Booking) => void
  loading?: boolean
}

export function BookingTable({
  bookings,
  selectedIds,
  onSelectChange,
  onSelectAll,
  onAction,
  loading = false
}: BookingTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
      case 'no_show':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">No-Show</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (booking: Booking) => {
    if (!booking.swimmer?.funding_source) {
      return <Badge variant="outline" className="bg-gray-50">Private Pay</Badge>
    }

    const type = booking.swimmer.funding_source.type
    switch (type) {
      case 'regional_center':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {booking.swimmer.funding_source.short_name || 'Regional Center'}
          </Badge>
        )
      case 'scholarship':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Scholarship</Badge>
      default:
        return <Badge variant="outline">Private Pay</Badge>
    }
  }

  const getTypeBadge = (bookingType: string) => {
    switch (bookingType) {
      case 'lesson':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Lesson</Badge>
      case 'assessment':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Assessment</Badge>
      case 'floating':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Floating</Badge>
      default:
        return <Badge variant="outline">{bookingType}</Badge>
    }
  }

  const isPastSession = (startTime: string) => {
    return new Date(startTime) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try adjusting your filters or create a new booking to get started.
        </p>
      </div>
    )
  }

  const allSelected = bookings.length > 0 && selectedIds.length === bookings.length
  const indeterminate = selectedIds.length > 0 && selectedIds.length < bookings.length

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                ref={(node) => {
                  if (node) {
                    node.indeterminate = indeterminate
                  }
                }}
                aria-label="Select all bookings"
              />
            </TableHead>
            <TableHead>Swimmer</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            if (!booking.session || !booking.swimmer) return null

            const isPast = isPastSession(booking.session.start_time)
            const isSelected = selectedIds.includes(booking.id)

            return (
              <TableRow
                key={booking.id}
                className={cn(
                  isPast && 'opacity-70',
                  isSelected && 'bg-blue-50',
                  expandedRow === booking.id && 'bg-gray-50'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectChange(booking.id)}
                    aria-label={`Select booking for ${booking.swimmer.first_name} ${booking.swimmer.last_name}`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/swimmers/${booking.swimmer.id}`}
                      className="font-medium hover:text-blue-600 flex items-center gap-1"
                    >
                      {booking.swimmer.first_name} {booking.swimmer.last_name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {booking.swimmer.flexible_swimmer && (
                      <Badge variant="outline" className="text-xs mt-1 bg-amber-50 text-amber-700">
                        Flexible
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{booking.parent?.full_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{booking.parent?.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">
                      {format(new Date(booking.session.start_time), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(booking.session.start_time), 'h:mm a')} • {booking.session.location}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{booking.session.instructor?.full_name || 'TBD'}</p>
                    {booking.session.instructor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onAction('change_instructor', booking)}
                        aria-label="Change instructor"
                      >
                        <UserCog className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(booking.booking_type)}</TableCell>
                <TableCell>{getPaymentBadge(booking)}</TableCell>
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onAction('view_details', booking)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('edit', booking)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Booking
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {booking.status === 'confirmed' && !isPast && (
                        <>
                          <DropdownMenuItem onClick={() => onAction('change_instructor', booking)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAction('reschedule', booking)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onAction('cancel', booking)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </>
                      )}
                      {booking.status === 'confirmed' && isPast && (
                        <>
                          <DropdownMenuItem onClick={() => onAction('mark_completed', booking)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onAction('mark_no_show', booking)}
                            className="text-amber-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Mark as No-Show
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onAction('delete', booking)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Booking
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}