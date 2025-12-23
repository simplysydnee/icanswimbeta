'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle, Circle, CircleDot, Loader2, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  date_mastered?: string;
  date_started?: string;
  instructor_notes?: string;
  updated_at?: string;
}

interface SkillsResponse {
  swimmerId: string;
  currentLevel: SwimLevel | null;
  skills: SwimmerSkill[];
  levelPromoted?: boolean;
  newLevel?: SwimLevel;
}

interface SkillChecklistProps {
  swimmerId: string;
  onSkillsChange?: (workingOn: string[], mastered: string[]) => void;
  initialWorkingOn?: string[];
  initialMastered?: string[];
  readOnly?: boolean;
}

export function SkillChecklist({
  swimmerId,
  onSkillsChange,
  initialWorkingOn = [],
  initialMastered = [],
  readOnly = false,
}: SkillChecklistProps) {
  const { toast } = useToast();
  const [skills, setSkills] = useState<SwimmerSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelPromoted, setLevelPromoted] = useState(false);
  const [newLevel, setNewLevel] = useState<SwimLevel | null>(null);

  // Local state for skill changes
  const [workingOn, setWorkingOn] = useState<string[]>(initialWorkingOn);
  const [mastered, setMastered] = useState<string[]>(initialMastered);
  const [skillNotes, setSkillNotes] = useState<Record<string, string>>({});

  // Fetch skills with useCallback (per best practices)
  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLevelPromoted(false);
      setNewLevel(null);

      const response = await fetch(`/api/swimmers/${swimmerId}/skills`);
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data: SkillsResponse = await response.json();
      setSkills(data.skills || []);

      // Initialize selections based on skill status
      const initialWorkingOnIds: string[] = [];
      const initialMasteredIds: string[] = [];
      const initialNotes: Record<string, string> = {};

      data.skills?.forEach((skill: SwimmerSkill) => {
        if (skill.status === 'in_progress') {
          initialWorkingOnIds.push(skill.id);
        } else if (skill.status === 'mastered') {
          initialMasteredIds.push(skill.id);
        }
        if (skill.instructor_notes) {
          initialNotes[skill.id] = skill.instructor_notes;
        }
      });

      setWorkingOn(initialWorkingOnIds);
      setMastered(initialMasteredIds);
      setSkillNotes(initialNotes);

      // Handle level promotion from previous update
      if (data.levelPromoted && data.newLevel) {
        setLevelPromoted(true);
        setNewLevel(data.newLevel);
        toast({
          title: 'Level Up! 🎉',
          description: `Swimmer has been promoted to ${data.newLevel.display_name} level!`,
          variant: 'default',
        });
      }

    } catch (err) {
      console.error('Error fetching skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
      toast({
        title: 'Error',
        description: 'Failed to load skills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [swimmerId]);

  // useEffect with proper dependencies (per best practices)
  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Notify parent of skill changes
  useEffect(() => {
    if (onSkillsChange) {
      onSkillsChange(workingOn, mastered);
    }
  }, [workingOn, mastered, onSkillsChange]);

  // Group skills by level
  const skillsByLevel = useMemo(() => {
    const grouped: Record<string, SwimmerSkill[]> = {};
    skills.forEach(skill => {
      const levelId = skill.level.id;
      if (!grouped[levelId]) {
        grouped[levelId] = [];
      }
      grouped[levelId].push(skill);
    });
    return grouped;
  }, [skills]);

  // Get levels sorted by sequence
  const levels = useMemo(() => {
    const levelIds = Object.keys(skillsByLevel);
    return levelIds
      .map(levelId => skills.find(s => s.level.id === levelId)?.level)
      .filter((level): level is SwimLevel => level !== undefined)
      .sort((a, b) => a.sequence - b.sequence);
  }, [skills, skillsByLevel]);

  // Handle skill status change
  const handleStatusChange = async (skillId: string, newStatus: 'in_progress' | 'mastered') => {
    if (readOnly || saving) return;

    try {
      setSaving(true);

      // Update local state immediately for responsive UI
      if (newStatus === 'in_progress') {
        setWorkingOn(prev => [...prev.filter(id => id !== skillId), skillId]);
        setMastered(prev => prev.filter(id => id !== skillId));
      } else if (newStatus === 'mastered') {
        setMastered(prev => [...prev.filter(id => id !== skillId), skillId]);
        setWorkingOn(prev => prev.filter(id => id !== skillId));
      }

      // Send update to API
      const response = await fetch(`/api/swimmers/${swimmerId}/skills`, {
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

      // Refresh skills to get updated dates
      await fetchSkills();

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
      // Revert local state on error
      fetchSkills();
    } finally {
      setSaving(false);
    }
  };

  // Handle notes change
  const handleNotesChange = (skillId: string, notes: string) => {
    setSkillNotes(prev => ({ ...prev, [skillId]: notes }));
  };

  // Get skill status
  const getSkillStatus = (skillId: string): 'not_started' | 'in_progress' | 'mastered' => {
    if (mastered.includes(skillId)) return 'mastered';
    if (workingOn.includes(skillId)) return 'in_progress';
    return 'not_started';
  };

  // Get status icon
  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'mastered') => {
    switch (status) {
      case 'mastered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <CircleDot className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  // Get status color
  const getStatusColor = (status: 'not_started' | 'in_progress' | 'mastered') => {
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status text
  const getStatusText = (status: 'not_started' | 'in_progress' | 'mastered') => {
    switch (status) {
      case 'mastered':
        return 'Mastered';
      case 'in_progress':
        return 'Working On';
      default:
        return 'Not Started';
    }
  };

  // Loading state with Skeletons (per best practices)
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
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
              onClick={fetchSkills}
              aria-label="Retry loading skills"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No skills found for this swimmer&apos;s level.</p>
          <p className="text-sm text-muted-foreground mt-1">
            The swimmer may need to be assigned a swim level first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Skill Tracking</CardTitle>
            <CardDescription>
              Track swimmer progress by level
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
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{skills.length}</div>
              <div className="text-xs text-muted-foreground">Total Skills</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {skills.filter(s => getSkillStatus(s.id) === 'in_progress').length}
              </div>
              <div className="text-xs text-yellow-600">Working On</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {skills.filter(s => getSkillStatus(s.id) === 'mastered').length}
              </div>
              <div className="text-xs text-green-600">Mastered</div>
            </div>
          </div>

          {/* Skills by level */}
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
                    const status = getSkillStatus(skill.id);
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
                              {skill.date_started && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Started: {new Date(skill.date_started).toLocaleDateString()}</span>
                                </div>
                              )}
                              {skill.date_mastered && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>Mastered: {new Date(skill.date_mastered).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                              {skill.instructor_notes && !readOnly && (
                                <div className="p-2 bg-white border rounded text-xs">
                                  <p className="font-medium text-gray-700">Previous Notes:</p>
                                  <p className="text-gray-600 mt-1">{skill.instructor_notes}</p>
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
                                    onChange={(e) => handleNotesChange(skill.id, e.target.value)}
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
                                  onClick={() => handleStatusChange(skill.id, 'in_progress')}
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
                                  onClick={() => handleStatusChange(skill.id, 'mastered')}
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

          {/* Legend */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Legend:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs">Mastered</span>
              </div>
              <div className="flex items-center gap-1">
                <CircleDot className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">Working On</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-4 w-4 text-gray-300" />
                <span className="text-xs">Not Started</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}