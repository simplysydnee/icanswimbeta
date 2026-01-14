'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Brain, Zap, ChevronDown, ChevronRight, Info, CheckCircle, Sparkles } from 'lucide-react'

interface SwimmerStrategy {
  id: string
  strategy: string
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
      .order('created_at')

    if (strategiesError) {
      console.error('Error fetching swimmer strategies:', strategiesError)
      throw new Error('Failed to fetch swimmer strategies')
    }

    // Create a map of existing strategies by name for quick lookup
    const existingStrategiesMap = new Map(
      existingStrategies?.map(strategy => [strategy.strategy, strategy]) || []
    )

    // Ensure all standard strategies exist
    const allStrategies: SwimmerStrategy[] = []

    for (const standardStrategy of STANDARD_STRATEGIES) {
      const existingStrategy = existingStrategiesMap.get(standardStrategy.name)

      if (existingStrategy) {
        // Use existing strategy
        allStrategies.push({
          id: existingStrategy.id,
          strategy: existingStrategy.strategy,
          is_used: existingStrategy.is_used,
          notes: existingStrategy.notes,
          updated_by: existingStrategy.updated_by,
          updated_at: existingStrategy.updated_at
        })
      } else {
        // Create a placeholder for missing strategy (will be created on first toggle)
        allStrategies.push({
          id: `placeholder-${standardStrategy.name.toLowerCase().replace(/\s+/g, '-')}`,
          strategy: standardStrategy.name,
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

    // Check if strategy record exists
    const { data: existing, error: checkError } = await supabase
      .from('swimmer_strategies')
      .select('id')
      .eq('swimmer_id', swimmerId)
      .eq('id', strategyId)
      .single()

    let result

    if (checkError || strategyId.startsWith('placeholder-')) {
      // Record doesn't exist or is a placeholder, insert new
      result = await supabase
        .from('swimmer_strategies')
        .insert({
          swimmer_id: swimmerId,
          strategy: strategyName,
          ...updateData,
          created_at: now
        })
        .select()
        .single()
    } else {
      // Record exists, update
      result = await supabase
        .from('swimmer_strategies')
        .update(updateData)
        .eq('id', strategyId)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error toggling strategy:', result.error)
      throw new Error('Failed to update strategy')
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
        description: `${updatedStrategy.strategy} has been ${updatedStrategy.is_used ? 'added to' : 'removed from'} active strategies.`,
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

  const handleToggleStrategy = (strategyId: string, strategyName: string, currentIsUsed: boolean) => {
    setTogglingStrategyId(strategyId)
    toggleMutation.mutate({
      strategyId,
      strategyName,
      isUsed: !currentIsUsed
    })
  }

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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading strategies</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch strategies'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">⚡ Strategies Used</h3>
                <p className="text-gray-600">Behavioral supports that help this swimmer</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{activeCount}/{totalStrategies}</div>
                <p className="text-sm text-gray-600">Strategies active</p>
              </div>
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="3"
                    strokeDasharray={`${Math.round((activeCount / totalStrategies) * 100)}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((activeCount / totalStrategies) * 100)}%
                  </span>
                  <span className="text-xs text-gray-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">{activeCount} active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-700">{totalStrategies - activeCount} available</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Descriptions Reference */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="flex items-center justify-between cursor-pointer p-3 -mx-3 rounded-lg hover:bg-gray-50"
            onClick={() => setShowDescriptions(!showDescriptions)}
          >
            <div className="flex items-center gap-3">
              {showDescriptions ? (
                <ChevronDown className="h-5 w-5 text-purple-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-purple-600" />
              )}
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Strategy Descriptions Reference
                </h3>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              {STANDARD_STRATEGIES.length} strategies
            </Badge>
          </div>

          {showDescriptions && (
            <div className="mt-4 space-y-3">
              {STANDARD_STRATEGIES.map((strategy, index) => (
                <div
                  key={strategy.name}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <div className="h-8 w-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-700">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategies Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Strategies Checklist</h3>
          <p className="text-sm text-gray-600">
            Tap to toggle strategies used with this swimmer
          </p>
        </div>

        {strategies?.map((strategy, index) => {
          const isToggling = togglingStrategyId === strategy.id
          const strategyDescription = STANDARD_STRATEGIES.find(s => s.name === strategy.strategy)?.description

          return (
            <Card
              key={strategy.id}
              className={`transition-all duration-200 ${
                strategy.is_used
                  ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Large Checkbox */}
                    <div className="shrink-0">
                      <div className="relative">
                        <Checkbox
                          id={`strategy-${strategy.id}`}
                          checked={strategy.is_used}
                          onCheckedChange={() => handleToggleStrategy(strategy.id, strategy.strategy, strategy.is_used)}
                          disabled={isToggling}
                          className="h-8 w-8 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        {isToggling && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strategy Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Label
                          htmlFor={`strategy-${strategy.id}`}
                          className="text-lg font-semibold text-gray-900 cursor-pointer truncate"
                        >
                          {strategy.strategy}
                        </Label>
                        {strategy.is_used && (
                          <Badge className="bg-purple-600 hover:bg-purple-700">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Used
                          </Badge>
                        )}
                      </div>

                      {/* Strategy Description */}
                      {strategyDescription && (
                        <p className="text-sm text-gray-600 mb-3">
                          {strategyDescription}
                        </p>
                      )}

                      {/* Notes */}
                      {strategy.notes && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{strategy.notes}</p>
                        </div>
                      )}

                      {/* Last Updated */}
                      {strategy.updated_by && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated by instructor
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Strategy Number */}
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="font-bold text-gray-700">{index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">
                        {strategy.is_used ? 'Active strategy' : 'Not currently used'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStrategy(strategy.id, strategy.strategy, strategy.is_used)}
                      disabled={isToggling}
                      className={strategy.is_used ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' : ''}
                    >
                      {isToggling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : strategy.is_used ? (
                        'Deactivate'
                      ) : (
                        'Activate'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {(!strategies || strategies.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No strategies found</h3>
              <p className="text-gray-500 mt-2">
                Strategies data is not available for this swimmer. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">How to use strategies effectively</h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
              <span>Activate strategies that are currently helping this swimmer</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
              <span>Strategies can be toggled on/off as swimmer's needs change</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
              <span>Use the reference section above to understand each strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
              <span>All updates are tracked with timestamp and instructor ID</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>Behavioral strategies help support swimmers with different needs. Toggle strategies as swimmer's needs evolve.</p>
        <p className="mt-1">Active strategies are visible to all instructors working with this swimmer.</p>
      </div>
    </div>
  )
}