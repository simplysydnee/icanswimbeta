'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'

interface BookingSummaryStatsProps {
  stats: {
    open_sessions: number
    booked: number
    confirmed: number
    completed: number
    cancelled: number
    no_shows: number
  }
  loading?: boolean
}

export function BookingSummaryStats({ stats, loading = false }: BookingSummaryStatsProps) {
  const statCards = [
    {
      title: 'Open Sessions',
      value: stats.open_sessions,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Booked',
      value: stats.booked,
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-700',
      borderColor: 'border-green-200'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      color: 'bg-red-50 text-red-700',
      borderColor: 'border-red-200'
    },
    {
      title: 'No-Shows',
      value: stats.no_shows,
      icon: AlertCircle,
      color: 'bg-gray-50 text-gray-700',
      borderColor: 'border-gray-200'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.title}
            className={`border ${stat.borderColor} hover:shadow-md transition-shadow`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}