'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Brain, ChevronDown, ChevronRight, Info, CheckCircle } from 'lucide-react'

interface SwimmerStrategy {
  id: string
  strategy_name: string
  is_used: boolean
  notes: string | null
  updated_by: string | null
  updated_at: string
}

interface StrategiesTabProps {
  swimmerId: string
  instructorId: string
}

// Standard 11 Strategies with descriptions
const STANDARD_STRATEGIES = [
  {
    name: 'Visual Support',
    description: 'Picture schedules, visual timers, written instructions'
  },
  {
    name: 'AAC (Augmentative and Alternative Communication)',
    description: 'Communication devices, PECS, sign language support'
  },
  {
    name: 'First/Then',
    description: 'First [task], then [reward] structure'
  },
  {
    name: 'Processing Time',
    description: 'Extra time to process instructions'
  },
  {
    name: 'Sensory Breaks',
    description: 'Breaks for sensory regulation'
  },
  {
    name: 'Heavy Work',
    description: 'Deep pressure activities for calming'
  },
  {
    name: 'Modeling',
    description: 'Demonstrating skills before asking swimmer to try'
  },
  {
    name: 'Hands-on Support',
    description: 'Physical guidance and assistance'
  },
  {
    name: 'Toy Breaks',
    description: 'Motivational breaks with preferred items'
  },
  {
    name: 'Praise',
    description: 'Positive reinforcement and encouragement'
  },
  {
    name: 'Rephrasing',
    description: 'Simplifying or restating instructions'
  }
]

async function fetchSwimmerStrategies(swimmerId: string): Promise<SwimmerStrategy[]> {
  const supabase = createClient()

  try {
    // Fetch existing strategies for this swimmer
    const { data: existingStrategies, error: strategiesError } = await supabase
      .from('swimmer_strategies')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('created_at') as { data: SwimmerStrategy[] | null, error: any }

    if (strategiesError) {
      console.error('Error fetching swimmer strategies:', strategiesError)
      throw new Error('Failed to fetch swimmer strategies')
    }

    // Helper function to normalize strategy names for matching
    const normalizeStrategyName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/\s+/g, ' ') // normalize spaces
        .replace(/[^\w\s/]/g, '') // remove punctuation except forward slash
        .replace(/\s+/g, ' ') // normalize spaces again
        .trim()
    }

    // Create a map of existing strategies by normalized name for flexible lookup
    const existingStrategiesMap = new Map<string, SwimmerStrategy>()

    existingStrategies?.forEach(strategy => {
      const normalized = normalizeStrategyName(strategy.strategy_name)
      // Only keep the first occurrence if there are duplicates
      if (!existingStrategiesMap.has(normalized)) {
        existingStrategiesMap.set(normalized, strategy)
      } else {
        console.warn(`Duplicate strategy name found (normalized): ${normalized}`, strategy)
      }
    })

    // Ensure all standard strategies exist
    const allStrategies: SwimmerStrategy[] = []

    for (const standardStrategy of STANDARD_STRATEGIES) {
      const normalizedStandardName = normalizeStrategyName(standardStrategy.name)
      const existingStrategy = existingStrategiesMap.get(normalizedStandardName)

      if (existingStrategy) {
        // Use existing strategy with its original name
        allStrategies.push({
          id: existingStrategy.id,
          strategy_name: standardStrategy.name, // Use standard name for consistency
          is_used: existingStrategy.is_used,
          notes: existingStrategy.notes,
          updated_by: existingStrategy.updated_by,
          updated_at: existingStrategy.updated_at
        })
      } else {
        // Create a placeholder for missing strategy (will be created on first toggle)
        allStrategies.push({
          id: `placeholder-${standardStrategy.name.toLowerCase().replace(/\s+/g, '-')}`,
          strategy_name: standardStrategy.name,
          is_used: false,
          notes: null,
          updated_by: null,
          updated_at: new Date().toISOString()
        })
      }
    }

    return allStrategies

  } catch (error) {
    console.error('Error in fetchSwimmerStrategies:', error)
    throw error
  }
}

async function toggleStrategy(
  swimmerId: string,
  strategyId: string,
  strategyName: string,
  isUsed: boolean,
  instructorId: string
) {
  const supabase = createClient()

  try {
    const now = new Date().toISOString()
    const updateData = {
      is_used: isUsed,
      updated_by: instructorId,
      updated_at: now
    }

    // Helper function to normalize strategy names for matching (same as in fetchSwimmerStrategies)
    const normalizeStrategyName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s/]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const normalizedTargetName = normalizeStrategyName(strategyName)

    // Fetch all strategies for this swimmer to find matching normalized name
    const { data: allSwimmerStrategies, error: fetchError } = await supabase
      .from('swimmer_strategies')
      .select('id, strategy_name')
      .eq('swimmer_id', swimmerId)

    if (fetchError) {
      console.error('Error fetching swimmer strategies for toggle:', fetchError)
      throw new Error(`Failed to fetch swimmer strategies: ${fetchError.message}`)
    }

    // Find existing strategy with matching normalized name
    let existingStrategy = null
    if (allSwimmerStrategies) {
      for (const strategy of allSwimmerStrategies) {
        if (normalizeStrategyName(strategy.strategy_name) === normalizedTargetName) {
          existingStrategy = strategy
          break
        }
      }
    }

    let result

    if (existingStrategy) {
      // Strategy exists (may have old name), update it
      console.log('Updating existing strategy:', {
        id: existingStrategy.id,
        oldName: existingStrategy.strategy_name,
        newName: strategyName, // standard name
        isUsed
      })

      // Update with standard strategy name to normalize data
      result = await supabase
        .from('swimmer_strategies')
        .update({
          ...updateData,
          strategy_name: strategyName // Update to standard name
        })
        .eq('id', existingStrategy.id)
        .select()
        .single()
    } else {
      // Strategy doesn't exist, insert new with standard name
      console.log('Inserting new strategy:', { swimmerId, strategyName, isUsed })
      result = await supabase
        .from('swimmer_strategies')
        .insert({
          swimmer_id: swimmerId,
          strategy_name: strategyName,
          ...updateData,
          created_at: now
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error toggling strategy:', result.error)
      console.error('Full error details:', JSON.stringify(result.error, null, 2))
      throw new Error(`Failed to update strategy: ${result.error.message}`)
    }

    return result.data

  } catch (error) {
    console.error('Error in toggleStrategy:', error)
    throw error
  }
}

export default function StrategiesTab({
  swimmerId,
  instructorId
}: StrategiesTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [togglingStrategyId, setTogglingStrategyId] = useState<string | null>(null)
  const [showDescriptions, setShowDescriptions] = useState(false)

  const { data: strategies, isLoading, error } = useQuery({
    queryKey: ['swimmerStrategies', swimmerId],
    queryFn: () => fetchSwimmerStrategies(swimmerId),
    enabled: !!swimmerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      strategyId,
      strategyName,
      isUsed
    }: {
      strategyId: string
      strategyName: string
      isUsed: boolean
    }) => toggleStrategy(swimmerId, strategyId, strategyName, isUsed, instructorId),
    onSuccess: (updatedStrategy) => {
      queryClient.invalidateQueries({ queryKey: ['swimmerStrategies', swimmerId] })
      queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
      toast({
        title: updatedStrategy.is_used ? 'Strategy activated' : 'Strategy deactivated',
        description: `${updatedStrategy.strategy_name} has been ${updatedStrategy.is_used ? 'added to' : 'removed from'} active strategies.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update strategy',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setTogglingStrategyId(null)
    }
  })


  // Calculate stats
  const activeCount = strategies?.filter(strategy => strategy.is_used).length || 0
  const totalStrategies = strategies?.length || STANDARD_STRATEGIES.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading strategies</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch strategies'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg border border-red-300 hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Behavioral Strategies</h2>
              <p className="text-xs text-gray-500">Supports that help this swimmer</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {activeCount}<span className="text-gray-400">/{totalStrategies}</span>
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Active Strategies</span>
            <span>{Math.round((activeCount / totalStrategies) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((activeCount / totalStrategies) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-purple-700">{activeCount}</div>
            <div className="text-xs text-purple-600">Active</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-700">{totalStrategies - activeCount}</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-purple-50 p-2 rounded-lg">
        <Brain className="w-4 h-4 text-purple-500" />
        <span>Tap any strategy to toggle on/off. Green = active, Gray = available</span>
      </div>

      {/* 2-Column Checkbox Grid - iPad-friendly touch targets */}
      <div className="grid grid-cols-2 gap-2">
        {strategies?.map((strategy) => {
          const isToggling = togglingStrategyId === strategy.id
          const strategyDescription = STANDARD_STRATEGIES.find(s => s.name === strategy.strategy_name)?.description

          const handleTap = () => {
            if (isToggling) return
            setTogglingStrategyId(strategy.id)
            toggleMutation.mutate({
              strategyId: strategy.id,
              strategyName: strategy.strategy_name,
              isUsed: !strategy.is_used
            })
          }

          return (
            <button
              key={strategy.id}
              onClick={handleTap}
              disabled={isToggling}
              className={`min-h-[44px] p-3 rounded-lg border text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                strategy.is_used
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
              aria-label={`${strategy.is_used ? 'Deactivate' : 'Activate'} ${strategy.strategy_name}`}
            >
              <div className="flex items-start gap-2">
                {/* Checkbox */}
                <div className="shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    strategy.is_used
                      ? 'bg-green-500 border-green-600'
                      : 'bg-white border-gray-400'
                  }`}>
                    {strategy.is_used && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isToggling && (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    )}
                  </div>
                </div>

                {/* Strategy Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{strategy.strategy_name}</div>
                  {strategyDescription && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {strategyDescription}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {(!strategies || strategies.length === 0) && (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No strategies found</h3>
          <p className="text-gray-500 text-sm mt-1">
            Strategies data is not available for this swimmer.
          </p>
        </div>
      )}

      {/* Strategy Descriptions Reference */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowDescriptions(!showDescriptions)}
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-purple-800 text-sm">Strategy Descriptions</h4>
          </div>
          {showDescriptions ? (
            <ChevronDown className="h-4 w-4 text-purple-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-purple-600" />
          )}
        </div>

        {showDescriptions && (
          <div className="mt-3 space-y-2">
            {STANDARD_STRATEGIES.map((strategy, index) => (
              <div key={strategy.name} className="p-3 rounded-lg bg-white border border-purple-200">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{strategy.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{strategy.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Tips */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
        <h4 className="font-medium text-purple-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          How to use strategies
        </h4>
        <ul className="mt-2 text-xs text-purple-700 space-y-1">
          <li>• Tap any strategy to toggle on/off</li>
          <li>• Green = active strategy being used</li>
          <li>• Gray = available strategy</li>
          <li>• 2-column grid fits all 11 strategies on iPad screen</li>
          <li>• Large touch targets (44px min height) for poolside use</li>
        </ul>
      </div>
    </div>
  )
}