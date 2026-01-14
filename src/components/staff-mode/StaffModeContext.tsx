'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface Instructor {
  id: string
  name: string
  avatarUrl?: string
}

export interface StaffModeContextType {
  selectedInstructor: Instructor | null
  setSelectedInstructor: (instructor: Instructor | null) => void
  clearInstructor: () => void
  isLoading: boolean
  error: string | null
}

const StaffModeContext = createContext<StaffModeContextType>({
  selectedInstructor: null,
  setSelectedInstructor: () => {},
  clearInstructor: () => {},
  isLoading: false,
  error: null,
})

export const useStaffMode = () => {
  const context = useContext(StaffModeContext)
  if (!context) {
    throw new Error('useStaffMode must be used within StaffModeProvider')
  }
  return context
}

interface StaffModeProviderProps {
  children: ReactNode
}

export function StaffModeProvider({ children }: StaffModeProviderProps) {
  const [selectedInstructor, setSelectedInstructorState] = useState<Instructor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const setSelectedInstructor = (instructor: Instructor | null) => {
    try {
      setIsLoading(true)
      setError(null)

      if (instructor) {
        // Store instructor in localStorage for persistence
        localStorage.setItem('staffModeInstructor', JSON.stringify(instructor))
        setSelectedInstructorState(instructor)

        // Navigate to staff mode schedule
        router.push('/staff-mode/schedule')
      } else {
        clearInstructor()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set instructor')
      console.error('Error setting instructor:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearInstructor = () => {
    try {
      localStorage.removeItem('staffModeInstructor')
      setSelectedInstructorState(null)
      // Navigate back to instructor selection
      router.push('/staff-mode')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear instructor')
      console.error('Error clearing instructor:', err)
    }
  }

  // Load instructor from localStorage on mount
  useState(() => {
    try {
      const storedInstructor = localStorage.getItem('staffModeInstructor')
      if (storedInstructor) {
        const instructor = JSON.parse(storedInstructor)
        setSelectedInstructorState(instructor)
      }
    } catch (err) {
      console.error('Error loading instructor from localStorage:', err)
      // Clear invalid storage
      localStorage.removeItem('staffModeInstructor')
    }
  })

  return (
    <StaffModeContext.Provider
      value={{
        selectedInstructor,
        setSelectedInstructor,
        clearInstructor,
        isLoading,
        error,
      }}
    >
      {children}
    </StaffModeContext.Provider>
  )
}