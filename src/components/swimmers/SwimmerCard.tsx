import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronRight } from 'lucide-react'

interface SwimmerCardProps {
  swimmer: {
    id: string
    first_name: string
    last_name: string
    photo_url?: string
    enrollment_status?: string
    current_level?: { name: string }
    payment_type?: string
  }
  onClick?: () => void
}

export function SwimmerCard({ swimmer, onClick }: SwimmerCardProps) {
  const statusColors: Record<string, string> = {
    enrolled: 'bg-green-100 text-green-800',
    waitlist: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <div
      className="flex items-center gap-3 p-4 bg-white rounded-lg border shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={swimmer.photo_url} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {swimmer.first_name?.charAt(0)}{swimmer.last_name?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">
          {swimmer.first_name} {swimmer.last_name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {swimmer.current_level?.name || 'No Level'}
          </Badge>
          <Badge className={`text-xs ${statusColors[swimmer.enrollment_status || ''] || 'bg-gray-100'}`}>
            {swimmer.enrollment_status || 'Unknown'}
          </Badge>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </div>
  )
}