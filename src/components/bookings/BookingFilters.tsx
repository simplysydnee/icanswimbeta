'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { CalendarIcon, Filter, X, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BookingFilters as BookingFiltersType } from './types'
import { LOCATIONS } from '@/config/constants'

interface BookingFiltersProps {
  onFilterChange: (filters: BookingFiltersType) => void
  onClearFilters: () => void
  instructors: Array<{ id: string; full_name: string }>
  loading?: boolean
}

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom Range', value: 'custom' }
]

const TIME_RANGES = [
  { label: 'All', value: 'all' },
  { label: 'Morning (before 12pm)', value: 'morning' },
  { label: 'Afternoon (12-5pm)', value: 'afternoon' },
  { label: 'Evening (after 5pm)', value: 'evening' }
]

const STATUS_OPTIONS = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No-Show', value: 'no_show' }
]

const PAYMENT_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Private Pay', value: 'private_pay' },
  { label: 'Regional Center', value: 'regional_center' }
]

export function BookingFilters({
  onFilterChange,
  onClearFilters,
  instructors,
  loading = false
}: BookingFiltersProps) {
  const [dateRange, setDateRange] = useState<string>('this_week')
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date
    to?: Date
  }>({})
  const [timeRange, setTimeRange] = useState<string>('all')
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['confirmed'])
  const [paymentType, setPaymentType] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'tomorrow':
        start.setDate(now.getDate() + 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(now.getDate() + 1)
        end.setHours(23, 59, 59, 999)
        break
      case 'this_week':
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
        end.setDate(diff + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'this_month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(now.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          start.setTime(customDateRange.from.getTime())
          end.setTime(customDateRange.to.getTime())
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        }
        break
    }

    return { start, end }
  }

  // Apply filters when they change
  useEffect(() => {
    const { start, end } = getDateRange()

    const filters: BookingFiltersType = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timeRange: timeRange as any,
      instructorId: selectedInstructor !== 'all' ? selectedInstructor : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      paymentType: paymentType as any,
      search: search.trim() || undefined,
      location: location !== 'all' ? location : undefined
    }

    onFilterChange(filters)
  }, [
    dateRange,
    customDateRange,
    timeRange,
    selectedInstructor,
    selectedStatuses,
    paymentType,
    search,
    location
  ])

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleClearFilters = () => {
    setDateRange('this_week')
    setCustomDateRange({})
    setTimeRange('all')
    setSelectedInstructor('all')
    setSelectedStatuses(['confirmed'])
    setPaymentType('all')
    setSearch('')
    setLocation('all')
    onClearFilters()
  }

  const hasActiveFilters = () => {
    return (
      dateRange !== 'this_week' ||
      timeRange !== 'all' ||
      selectedInstructor !== 'all' ||
      selectedStatuses.length !== 1 ||
      selectedStatuses[0] !== 'confirmed' ||
      paymentType !== 'all' ||
      search.trim() !== '' ||
      location !== 'all'
    )
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Clear Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by swimmer, parent, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {hasActiveFilters() && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dateRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Instructor</Label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Payment Types" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Badge
                  key={status.value}
                  variant={selectedStatuses.includes(status.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(status.value)}
                >
                  {status.label}
                  {selectedStatuses.includes(status.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={location === 'all' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setLocation('all')}
              >
                All Locations
              </Badge>
              {LOCATIONS.map((loc) => (
                <Badge
                  key={loc.value}
                  variant={location === loc.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLocation(loc.value)}
                >
                  {loc.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}