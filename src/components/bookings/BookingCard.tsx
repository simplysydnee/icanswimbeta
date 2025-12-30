import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User } from 'lucide-react'
import { format } from 'date-fns'

interface BookingCardProps {
  booking: {
    id: string
    session?: {
      start_time: string
      end_time: string
      instructor?: { full_name: string }
    }
    swimmer?: {
      first_name: string
      last_name: string
    }
    status: string
  }
  onClick?: () => void
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }

  const sessionDate = booking.session?.start_time
    ? new Date(booking.session.start_time)
    : null

  return (
    <div
      className="p-4 bg-white rounded-lg border shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="font-semibold">
          {booking.swimmer?.first_name} {booking.swimmer?.last_name}
        </div>
        <Badge className={statusColors[booking.status] || 'bg-gray-100'}>
          {booking.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {sessionDate && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(sessionDate, 'EEE, MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{format(sessionDate, 'h:mm a')}</span>
            </div>
          </>
        )}
        {booking.session?.instructor && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{booking.session.instructor.full_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}