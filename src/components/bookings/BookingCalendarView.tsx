'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Booking } from './types'

interface BookingCalendarViewProps {
  bookings: Booking[]
}

export function BookingCalendarView({ bookings }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')

  // Get start of week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Group bookings by date
  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach(booking => {
    if (booking.session?.start_time) {
      const date = new Date(booking.session.start_time).toISOString().split('T')[0]
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = []
      }
      bookingsByDate[date].push(booking)
    }
  })

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'no_show':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              disabled
            >
              Month (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <div className="border rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="p-3 text-center border-r last:border-r-0"
                >
                  <div className="text-sm font-medium text-gray-500">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isSameDay(day, new Date()) ? 'text-blue-600' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Day Content */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDays.map((day) => {
                const dateKey = day.toISOString().split('T')[0]
                const dayBookings = bookingsByDate[dateKey] || []
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={dateKey}
                    className={`border-r last:border-r-0 p-2 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      {dayBookings.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No bookings</p>
                        </div>
                      ) : (
                        dayBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`p-2 rounded border ${getStatusColor(booking.status)}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {booking.session && format(new Date(booking.session.start_time), 'h:mm a')}
                                </Badge>
                                <Badge className="text-xs">
                                  {booking.status}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm truncate">
                                {booking.swimmer?.first_name} {booking.swimmer?.last_name}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {booking.session?.instructor?.full_name || 'TBD'} • {booking.session?.location}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {booking.booking_type}
                                </Badge>
                                {booking.swimmer?.flexible_swimmer && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                                    Flexible
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Legend</h4>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-100 border border-green-200" />
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-100 border border-blue-200" />
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
              <span className="text-xs">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-gray-100 border border-gray-200" />
              <span className="text-xs">No-Show</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-amber-100 border border-amber-200" />
              <span className="text-xs">Flexible Swimmer</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}