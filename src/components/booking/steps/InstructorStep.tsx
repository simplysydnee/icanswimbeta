'use client'

import { useQuery } from '@tanstack/react-query'
import { Instructor } from '@/types/booking'
import { InstructorAvatar } from '@/components/ui/instructor-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, User, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstructorStepProps {
  selectedInstructorId: string | null
  instructorPreference: 'any' | 'specific'
  onSelectInstructor: (id: string | null, preference: 'any' | 'specific') => void
}

export default function InstructorStep({
  selectedInstructorId,
  instructorPreference,
  onSelectInstructor,
}: InstructorStepProps) {
  // Fetch instructors using React Query
  const {
    data: instructors = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await fetch('/api/instructors')
      if (!response.ok) {
        throw new Error('Failed to fetch instructors')
      }
      return response.json() as Promise<Instructor[]>
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })


  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Any Available Instructor skeleton */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Divider skeleton */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Instructor grid skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load instructors. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Any Available Instructor card */}
      <button
        type="button"
        onClick={() => onSelectInstructor(null, 'any')}
        className={cn(
          'w-full text-left border rounded-lg p-6 transition-all hover:border-primary hover:bg-primary/5',
          instructorPreference === 'any' &&
            'border-primary bg-primary/5 ring-2 ring-primary/20'
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                instructorPreference === 'any'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Any Available Instructor</h3>
              {instructorPreference === 'any' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              More flexibility with scheduling. We'll match you with the best
              available instructor.
            </p>
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or choose a specific instructor
          </span>
        </div>
      </div>

      {/* Instructor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {instructors.map(instructor => {
          const isSelected =
            instructorPreference === 'specific' &&
            selectedInstructorId === instructor.id

          return (
            <button
              key={instructor.id}
              type="button"
              onClick={() => onSelectInstructor(instructor.id, 'specific')}
              className={cn(
                'w-full text-left border rounded-lg p-4 transition-all hover:border-primary hover:bg-primary/5',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <InstructorAvatar
                    name={instructor.fullName}
                    avatarUrl={instructor.avatarUrl}
                    size="sm"
                    showName={false}
                  />
                  <div>
                    <p className="font-medium">{instructor.fullName}</p>
                  </div>
                </div>
                <div
                  className={cn(
                    'h-5 w-5 rounded-full border flex items-center justify-center',
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {instructors.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No instructors available</p>
        </div>
      )}
    </div>
  )
}