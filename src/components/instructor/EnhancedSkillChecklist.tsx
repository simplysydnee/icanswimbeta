'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle, Circle, CircleDot, Loader2, AlertCircle, Calendar, MessageSquare, Target, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types from the new progress API
interface SwimLevel {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  sequence: number;
}

interface SwimmerSkill {
  id: string;
  name: string;
  description?: string;
  sequence: number;
  level: SwimLevel;
  status: 'not_started' | 'in_progress' | 'mastered';
  dateMastered?: string;
  dateStarted?: string;
  instructorNotes?: string;
  updatedAt?: string;
}

interface SwimmerTarget {
  id: string;
  swimmer_id: string;
  target_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  date_started?: string;
  date_met?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SwimmerStrategy {
  id: string;
  swimmer_id: string;
  strategy_name: string;
  is_used: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProgressResponse {
  swimmerId: string;
  currentLevel: SwimLevel | null;
  skills: SwimmerSkill[];
  targets: SwimmerTarget[];
  strategies: SwimmerStrategy[];
  totalSkills?: number;
  masteredSkills?: number;
  inProgressSkills?: number;
  totalTargets?: number;
  completedTargets?: number;
  totalStrategies?: number;
  usedStrategies?: number;
}

interface EnhancedSkillChecklistProps {
  swimmerId: string;
  onProgressChange?: (skills: SwimmerSkill[], targets: SwimmerTarget[], strategies: SwimmerStrategy[]) => void;
  readOnly?: boolean;
}

export function EnhancedSkillChecklist({
  swimmerId,
  onProgressChange,
  readOnly = false,
}: EnhancedSkillChecklistProps) {
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelPromoted, setLevelPromoted] = useState(false);
  const [newLevel, setNewLevel] = useState<SwimLevel | null>(null);

  // Local state for changes
  const [skillNotes, setSkillNotes] = useState<Record<string, string>>({});
  const [targetNotes, setTargetNotes] = useState<Record<string, string>>({});
  const [strategyNotes, setStrategyNotes] = useState<Record<string, string>>({});

  // Fetch progress data with useCallback (per best practices)
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLevelPromoted(false);
      setNewLevel(null);

      const response = await fetch(`/api/swimmers/${swimmerId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const data: ProgressResponse = await response.json();
      console.log('=== PROGRESS API RESPONSE ===');
      console.log('Progress data:', data);
      console.log('Skills count:', data.skills?.length);
      console.log('Targets count:', data.targets?.length);
      console.log('Strategies count:', data.strategies?.length);

      setProgressData(data);

      // Initialize notes from existing data
      const initialSkillNotes: Record<string, string> = {};
      const initialTargetNotes: Record<string, string> = {};
      const initialStrategyNotes: Record<string, string> = {};

      data.skills?.forEach((skill: SwimmerSkill) => {
        if (skill.instructorNotes) {
          initialSkillNotes[skill.id] = skill.instructorNotes;
        }
      });

      data.targets?.forEach((target: SwimmerTarget) => {
        if (target.notes) {
          initialTargetNotes[target.id] = target.notes;
        }
      });

      data.strategies?.forEach((strategy: SwimmerStrategy) => {
        if (strategy.notes) {
          initialStrategyNotes[strategy.id] = strategy.notes;
        }
      });

      setSkillNotes(initialSkillNotes);
      setTargetNotes(initialTargetNotes);
      setStrategyNotes(initialStrategyNotes);

      // Notify parent of initial data
      if (onProgressChange) {
        onProgressChange(data.skills, data.targets, data.strategies);
      }

    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [swimmerId, onProgressChange]);

  // useEffect with proper dependencies (per best practices)
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Handle skill status change
  const handleSkillStatusChange = async (skillId: string, newStatus: 'in_progress' | 'mastered') => {
    if (readOnly || saving) return;

    try {
      setSaving(true);

      // Send update to API
      const response = await fetch(`/api/swimmers/${swimmerId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: [{
            skillId,
            status: newStatus,
            instructorNotes: skillNotes[skillId] || '',
          }],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update skill');
      }

      // Handle level promotion
      if (result.levelPromoted && result.newLevel) {
        setLevelPromoted(true);
        setNewLevel(result.newLevel);
        toast({
          title: 'Level Up! 🎉',
          description: `Swimmer has been promoted to ${result.newLevel.display_name} level!`,
          variant: 'default',
        });
      }

      // Refresh data
      await fetchProgress();

      toast({
        title: 'Success',
        description: 'Skill updated successfully',
        variant: 'default',
      });

    } catch (err) {
      console.error('Error updating skill:', err);
      toast({
        title: 'Error',
        description: 'Failed to update skill',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle target status change
  const handleTargetStatusChange = async (targetId: string, newStatus: 'in_progress' | 'completed') => {
    if (readOnly || saving) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/swimmers/${swimmerId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: [{
            targetId,
            status: newStatus,
            notes: targetNotes[targetId] || '',
          }],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update target');
      }

      // Refresh data
      await fetchProgress();

      toast({
        title: 'Success',
        description: 'Target updated successfully',
        variant: 'default',
      });

    } catch (err) {
      console.error('Error updating target:', err);
      toast({
        title: 'Error',
        description: 'Failed to update target',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle strategy usage change
  const handleStrategyUsageChange = async (strategyId: string, isUsed: boolean) => {
    if (readOnly || saving) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/swimmers/${swimmerId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: [{
            strategyId,
            is_used: isUsed,
            notes: strategyNotes[strategyId] || '',
          }],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update strategy');
      }

      // Refresh data
      await fetchProgress();

      toast({
        title: 'Success',
        description: 'Strategy updated successfully',
        variant: 'default',
      });

    } catch (err) {
      console.error('Error updating strategy:', err);
      toast({
        title: 'Error',
        description: 'Failed to update strategy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get skill status
  const getSkillStatus = (skillId: string): 'not_started' | 'in_progress' | 'mastered' => {
    const skill = progressData?.skills.find(s => s.id === skillId);
    return skill?.status || 'not_started';
  };

  // Get target status
  const getTargetStatus = (targetId: string): 'not_started' | 'in_progress' | 'completed' => {
    const target = progressData?.targets.find(t => t.id === targetId);
    return target?.status || 'not_started';
  };

  // Get status icon
  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'mastered' | 'completed') => {
    switch (status) {
      case 'mastered':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <CircleDot className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  // Get status color
  const getStatusColor = (status: 'not_started' | 'in_progress' | 'mastered' | 'completed') => {
    switch (status) {
      case 'mastered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status text
  const getStatusText = (status: 'not_started' | 'in_progress' | 'mastered' | 'completed') => {
    switch (status) {
      case 'mastered':
        return 'Mastered';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'Working On';
      default:
        return 'Not Started';
    }
  };

  // Group skills by level
  const skillsByLevel = useMemo(() => {
    if (!progressData?.skills) return {};
    const grouped: Record<string, SwimmerSkill[]> = {};
    progressData.skills.forEach(skill => {
      if (!skill.level || !skill.level.id) {
        console.warn('Skill has no level or level.id:', skill);
        return;
      }
      const levelId = skill.level.id;
      if (!grouped[levelId]) {
        grouped[levelId] = [];
      }
      grouped[levelId].push(skill);
    });
    return grouped;
  }, [progressData?.skills]);

  // Get levels sorted by sequence
  const levels = useMemo(() => {
    const levelIds = Object.keys(skillsByLevel);
    const levels = levelIds
      .map(levelId => {
        const levelSkills = skillsByLevel[levelId];
        if (levelSkills && levelSkills.length > 0) {
          return levelSkills[0].level;
        }
        return null;
      })
      .filter((level): level is SwimLevel => level !== undefined && level !== null)
      .sort((a, b) => a.sequence - b.sequence);
    return levels;
  }, [skillsByLevel]);

  // Loading state with Skeletons
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProgress}
              aria-label="Retry loading progress data"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!progressData || (!progressData.skills?.length && !progressData.targets?.length && !progressData.strategies?.length)) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No progress data found for this swimmer.</p>
          <p className="text-sm text-muted-foreground mt-1">
            The swimmer may need to be assigned a swim level first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const skills = progressData.skills || [];
  const targets = progressData.targets || [];
  const strategies = progressData.strategies || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Progress Dashboard</CardTitle>
            <CardDescription>
              Track skills, targets, and strategies
            </CardDescription>
          </div>
          {levelPromoted && newLevel && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              🎉 Promoted to {newLevel.display_name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Skills Progress</p>
                  <p className="text-2xl font-bold">
                    {progressData.masteredSkills || 0}/{progressData.totalSkills || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <Progress
                value={progressData.totalSkills ? (progressData.masteredSkills || 0) / progressData.totalSkills * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Targets Completed</p>
                  <p className="text-2xl font-bold">
                    {progressData.completedTargets || 0}/{progressData.totalTargets || 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <Progress
                value={progressData.totalTargets ? (progressData.completedTargets || 0) / progressData.totalTargets * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Strategies Used</p>
                  <p className="text-2xl font-bold">
                    {progressData.usedStrategies || 0}/{progressData.totalStrategies || 0}
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500" />
              </div>
              <Progress
                value={progressData.totalStrategies ? (progressData.usedStrategies || 0) / progressData.totalStrategies * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Skills Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Skills ({skills.length})</h3>
          </div>

          {levels.map((level, levelIndex) => {
            const levelSkills = skillsByLevel[level.id] || [];
            const isCurrentLevel = levelIndex === 0; // First level is current
            const levelColor = level.color || '#3b82f6'; // Default blue

              return (
                <div key={level.id} className="space-y-3">
                  {/* Level header */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: levelColor }}
                      aria-hidden="true"
                    />
                    <h3 className="font-semibold text-lg">
                      {level.display_name} Level
                      {isCurrentLevel && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (Current Level)
                        </span>
                      )}
                      {!isCurrentLevel && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (Next Level)
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Level description */}
                  {level.description && (
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  )}

                  {/* Skills in this level */}
                  <div className="space-y-3">
                    {levelSkills.map(skill => {
                      const status = skill.status;
                      const isMastered = status === 'mastered';
                      const isInProgress = status === 'in_progress';

                      return (
                        <div
                          key={skill.id}
                          className={cn(
                            'p-4 border rounded-lg transition-colors',
                            isMastered && 'border-green-200 bg-green-50',
                            isInProgress && 'border-yellow-200 bg-yellow-50',
                            status === 'not_started' && 'border-gray-200'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <div className="mt-1">
                              {getStatusIcon(status)}
                            </div>

                            {/* Skill info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Label
                                    htmlFor={`skill-${skill.id}`}
                                    className={cn(
                                      'font-medium',
                                      isMastered && 'text-green-800',
                                      isInProgress && 'text-yellow-800'
                                    )}
                                  >
                                    {skill.name}
                                  </Label>
                                  {skill.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs', getStatusColor(status))}
                                >
                                  {getStatusText(status)}
                                </Badge>
                              </div>

                              {/* Dates */}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                {skill.dateStarted && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Started: {new Date(skill.dateStarted).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {skill.dateMastered && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>Mastered: {new Date(skill.dateMastered).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                {skill.instructorNotes && !readOnly && (
                                  <div className="p-2 bg-white border rounded text-xs">
                                    <p className="font-medium text-gray-700">Previous Notes:</p>
                                    <p className="text-gray-600 mt-1">{skill.instructorNotes}</p>
                                  </div>
                                )}
                                {!readOnly && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <MessageSquare className="h-3 w-3" />
                                      <Label htmlFor={`notes-${skill.id}`}>Notes:</Label>
                                    </div>
                                    <Textarea
                                      id={`notes-${skill.id}`}
                                      placeholder="Add notes about this skill..."
                                      value={skillNotes[skill.id] || ''}
                                      onChange={(e) => setSkillNotes(prev => ({ ...prev, [skill.id]: e.target.value }))}
                                      className="text-xs min-h-[60px]"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              {!readOnly && !saving && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant={isInProgress ? "default" : "outline"}
                                    className={cn(
                                      'text-xs',
                                      isInProgress && 'bg-yellow-500 hover:bg-yellow-600'
                                    )}
                                    onClick={() => handleSkillStatusChange(skill.id, 'in_progress')}
                                    disabled={isMastered}
                                    aria-label={`Mark "${skill.name}" as working on`}
                                  >
                                    Working On
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={isMastered ? "default" : "outline"}
                                    className={cn(
                                      'text-xs',
                                      isMastered && 'bg-green-500 hover:bg-green-600'
                                    )}
                                    onClick={() => handleSkillStatusChange(skill.id, 'mastered')}
                                    disabled={isInProgress}
                                    aria-label={`Mark "${skill.name}" as mastered`}
                                  >
                                    Mastered
                                  </Button>
                                </div>
                              )}

                              {/* Saving indicator */}
                              {saving && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Saving...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Targets Section */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Targets ({targets.length})</h3>
            </div>

            {targets.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground">No targets set for this swimmer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map(target => {
                  const status = target.status;
                  const isCompleted = status === 'completed';
                  const isInProgress = status === 'in_progress';

                  return (
                    <div
                      key={target.id}
                      className={cn(
                        'p-4 border rounded-lg transition-colors',
                        isCompleted && 'border-green-200 bg-green-50',
                        isInProgress && 'border-yellow-200 bg-yellow-50',
                        status === 'not_started' && 'border-gray-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        <div className="mt-1">
                          {getStatusIcon(status)}
                        </div>

                        {/* Target info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Label
                                htmlFor={`target-${target.id}`}
                                className={cn(
                                  'font-medium',
                                  isCompleted && 'text-green-800',
                                  isInProgress && 'text-yellow-800'
                                )}
                              >
                                {target.target_name}
                              </Label>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getStatusColor(status))}
                            >
                              {getStatusText(status)}
                            </Badge>
                          </div>

                          {/* Dates */}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            {target.date_started && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Started: {new Date(target.date_started).toLocaleDateString()}</span>
                              </div>
                            )}
                            {target.date_met && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>Completed: {new Date(target.date_met).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            {target.notes && !readOnly && (
                              <div className="p-2 bg-white border rounded text-xs">
                                <p className="font-medium text-gray-700">Previous Notes:</p>
                                <p className="text-gray-600 mt-1">{target.notes}</p>
                              </div>
                            )}
                            {!readOnly && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <MessageSquare className="h-3 w-3" />
                                  <Label htmlFor={`target-notes-${target.id}`}>Notes:</Label>
                                </div>
                                <Textarea
                                  id={`target-notes-${target.id}`}
                                  placeholder="Add notes about this target..."
                                  value={targetNotes[target.id] || ''}
                                  onChange={(e) => setTargetNotes(prev => ({ ...prev, [target.id]: e.target.value }))}
                                  className="text-xs min-h-[60px]"
                                />
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          {!readOnly && !saving && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant={isInProgress ? "default" : "outline"}
                                className={cn(
                                  'text-xs',
                                  isInProgress && 'bg-yellow-500 hover:bg-yellow-600'
                                )}
                                onClick={() => handleTargetStatusChange(target.id, 'in_progress')}
                                disabled={isCompleted}
                                aria-label={`Mark "${target.target_name}" as in progress`}
                              >
                                In Progress
                              </Button>
                              <Button
                                size="sm"
                                variant={isCompleted ? "default" : "outline"}
                                className={cn(
                                  'text-xs',
                                  isCompleted && 'bg-green-500 hover:bg-green-600'
                                )}
                                onClick={() => handleTargetStatusChange(target.id, 'completed')}
                                disabled={isInProgress}
                                aria-label={`Mark "${target.target_name}" as completed`}
                              >
                                Completed
                              </Button>
                            </div>
                          )}

                          {/* Saving indicator */}
                          {saving && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Saving...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strategies Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Strategies ({strategies.length})</h3>
            </div>

            {strategies.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground">No strategies set for this swimmer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {strategies.map(strategy => {
                  const isUsed = strategy.is_used;

                  return (
                    <div
                      key={strategy.id}
                      className={cn(
                        'p-4 border rounded-lg transition-colors',
                        isUsed && 'border-blue-200 bg-blue-50',
                        !isUsed && 'border-gray-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        <div className="mt-1">
                          {isUsed ? (
                            <Lightbulb className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Lightbulb className="h-5 w-5 text-gray-300" />
                          )}
                        </div>

                        {/* Strategy info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Label
                                htmlFor={`strategy-${strategy.id}`}
                                className={cn(
                                  'font-medium',
                                  isUsed && 'text-blue-800'
                                )}
                              >
                                {strategy.strategy_name}
                              </Label>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                isUsed ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                              )}
                            >
                              {isUsed ? 'Used' : 'Not Used'}
                            </Badge>
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            {strategy.notes && !readOnly && (
                              <div className="p-2 bg-white border rounded text-xs">
                                <p className="font-medium text-gray-700">Previous Notes:</p>
                                <p className="text-gray-600 mt-1">{strategy.notes}</p>
                              </div>
                            )}
                            {!readOnly && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <MessageSquare className="h-3 w-3" />
                                  <Label htmlFor={`strategy-notes-${strategy.id}`}>Notes:</Label>
                                </div>
                                <Textarea
                                  id={`strategy-notes-${strategy.id}`}
                                  placeholder="Add notes about this strategy..."
                                  value={strategyNotes[strategy.id] || ''}
                                  onChange={(e) => setStrategyNotes(prev => ({ ...prev, [strategy.id]: e.target.value }))}
                                  className="text-xs min-h-[60px]"
                                />
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          {!readOnly && !saving && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant={isUsed ? "default" : "outline"}
                                className={cn(
                                  'text-xs',
                                  isUsed && 'bg-blue-500 hover:bg-blue-600'
                                )}
                                onClick={() => handleStrategyUsageChange(strategy.id, !isUsed)}
                                aria-label={isUsed ? `Mark "${strategy.strategy_name}" as not used` : `Mark "${strategy.strategy_name}" as used`}
                              >
                                {isUsed ? 'Mark as Not Used' : 'Mark as Used'}
                              </Button>
                            </div>
                          )}

                          {/* Saving indicator */}
                          {saving && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Saving...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        {/* Legend */}
        <div className="pt-4 border-t mt-6">
          <p className="text-sm font-medium mb-2">Legend:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Mastered/Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <CircleDot className="h-4 w-4 text-yellow-500" />
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-4 w-4 text-gray-300" />
              <span className="text-xs">Not Started</span>
            </div>
            <div className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Strategy Used</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}