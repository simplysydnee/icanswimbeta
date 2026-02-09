'use client'

import { cn } from '@/lib/utils'

export type ThreeStateValue = 'not_started' | 'in_progress' | 'mastered'
export type ThreeStateSize = 'xs' | 'sm' | 'md' | 'lg'

interface ThreeStateSwitchProps {
  value: ThreeStateValue
  onChange: (value: ThreeStateValue) => void
  disabled?: boolean
  size?: ThreeStateSize
}

export function ThreeStateSwitch({
  value,
  onChange,
  disabled = false,
  size = 'md'
}: ThreeStateSwitchProps) {

  const sizeClasses = {
    xs: 'h-8 text-xs px-2 min-w-[60px]',
    sm: 'h-10 text-xs px-3 min-w-[70px]',
    md: 'h-11 text-sm px-4 min-w-[80px]',
    lg: 'h-12 text-base px-6 min-w-[90px]'
  }

  const buttonClass = sizeClasses[size]

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white shadow-sm">
      {/* Not Started Button */}
      <button
        type="button"
        onClick={() => !disabled && onChange('not_started')}
        disabled={disabled}
        className={cn(
          'rounded-l-lg font-medium transition-all',
          buttonClass,
          value === 'not_started'
            ? 'bg-gray-200 text-gray-900 border-r border-gray-400'
            : 'bg-white text-gray-600 hover:bg-gray-50 border-r border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        ---
      </button>

      {/* In Progress Button */}
      <button
        type="button"
        onClick={() => !disabled && onChange('in_progress')}
        disabled={disabled}
        className={cn(
          'font-medium transition-all',
          buttonClass,
          value === 'in_progress'
            ? 'bg-amber-100 text-amber-900 border-x border-amber-400'
            : 'bg-white text-gray-600 hover:bg-gray-50 border-x border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        Emerging
      </button>

      {/* Mastered Button */}
      <button
        type="button"
        onClick={() => !disabled && onChange('mastered')}
        disabled={disabled}
        className={cn(
          'rounded-r-lg font-medium transition-all',
          buttonClass,
          value === 'mastered'
            ? 'bg-green-100 text-green-900 border-l border-green-400'
            : 'bg-white text-gray-600 hover:bg-gray-50 border-l border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        Met ✓
      </button>
    </div>
  )
}

export default ThreeStateSwitch