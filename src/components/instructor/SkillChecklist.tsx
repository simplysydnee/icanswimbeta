'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, CircleDot, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Skill {
  id: string;
  name: string;
  description?: string;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  dateMastered?: string;
  instructorNotes?: string;
}

interface SkillChecklistProps {
  swimmerId: string;
  currentLevelId?: string;
  onSkillsChange?: (workingOn: string[], mastered: string[]) => void;
  initialWorkingOn?: string[];
  initialMastered?: string[];
  readOnly?: boolean;
}

export function SkillChecklist({
  swimmerId,
  currentLevelId,
  onSkillsChange,
  initialWorkingOn = [],
  initialMastered = [],
  readOnly = false,
}: SkillChecklistProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local state for selected skills
  const [workingOn, setWorkingOn] = useState<string[]>(initialWorkingOn);
  const [mastered, setMastered] = useState<string[]>(initialMastered);

  useEffect(() => {
    fetchSkills();
  }, [swimmerId, currentLevelId]);

  useEffect(() => {
    if (onSkillsChange) {
      onSkillsChange(workingOn, mastered);
    }
  }, [workingOn, mastered, onSkillsChange]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/swimmers/${swimmerId}/skills`);
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data = await response.json();
      setSkills(data.skills || []);

      // Initialize selections based on skill status
      const initialWorkingOnIds: string[] = [];
      const initialMasteredIds: string[] = [];

      data.skills?.forEach((skill: Skill) => {
        if (skill.status === 'in_progress') {
          initialWorkingOnIds.push(skill.id);
        } else if (skill.status === 'mastered') {
          initialMasteredIds.push(skill.id);
        }
      });

      setWorkingOn(initialWorkingOnIds);
      setMastered(initialMasteredIds);

    } catch (err) {
      console.error('Error fetching skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string, category: 'workingOn' | 'mastered') => {
    if (readOnly) return;

    if (category === 'workingOn') {
      const newWorkingOn = workingOn.includes(skillId)
        ? workingOn.filter(id => id !== skillId)
        : [...workingOn, skillId];

      // Remove from mastered if adding to workingOn
      const newMastered = mastered.filter(id => id !== skillId);

      setWorkingOn(newWorkingOn);
      setMastered(newMastered);
    } else {
      const newMastered = mastered.includes(skillId)
        ? mastered.filter(id => id !== skillId)
        : [...mastered, skillId];

      // Remove from workingOn if adding to mastered
      const newWorkingOn = workingOn.filter(id => id !== skillId);

      setMastered(newMastered);
      setWorkingOn(newWorkingOn);
    }
  };

  const getSkillIcon = (skillId: string) => {
    if (mastered.includes(skillId)) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (workingOn.includes(skillId)) {
      return <CircleDot className="h-5 w-5 text-blue-500" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getSkillStatusText = (skillId: string) => {
    if (mastered.includes(skillId)) {
      return 'Mastered';
    } else if (workingOn.includes(skillId)) {
      return 'Working On';
    } else {
      return 'Not Started';
    }
  };

  const getSkillStatusColor = (skillId: string) => {
    if (mastered.includes(skillId)) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (workingOn.includes(skillId)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resetSelections = () => {
    setWorkingOn([]);
    setMastered([]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading skills...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={fetchSkills}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              Select skills worked on and mastered during this lesson
            </CardDescription>
          </div>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={resetSelections}>
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{skills.length}</div>
              <div className="text-xs text-muted-foreground">Total Skills</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{workingOn.length}</div>
              <div className="text-xs text-blue-600">Working On</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{mastered.length}</div>
              <div className="text-xs text-green-600">Mastered</div>
            </div>
          </div>

          {/* Skills list */}
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  'p-3 border rounded-lg transition-colors',
                  mastered.includes(skill.id) && 'border-green-200 bg-green-50',
                  workingOn.includes(skill.id) && 'border-blue-200 bg-blue-50',
                  !mastered.includes(skill.id) && !workingOn.includes(skill.id) && 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-3">
                  {!readOnly ? (
                    <div className="flex flex-col gap-1 mt-1">
                      <Checkbox
                        id={`working-${skill.id}`}
                        checked={workingOn.includes(skill.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSkillToggle(skill.id, 'workingOn');
                          }
                        }}
                        disabled={mastered.includes(skill.id) || readOnly}
                      />
                      <Checkbox
                        id={`mastered-${skill.id}`}
                        checked={mastered.includes(skill.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSkillToggle(skill.id, 'mastered');
                          }
                        }}
                        disabled={workingOn.includes(skill.id) || readOnly}
                      />
                    </div>
                  ) : (
                    <div className="mt-1">
                      {getSkillIcon(skill.id)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label
                          htmlFor={`skill-${skill.id}`}
                          className={cn(
                            'font-medium',
                            mastered.includes(skill.id) && 'text-green-800',
                            workingOn.includes(skill.id) && 'text-blue-800'
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
                        className={cn('text-xs', getSkillStatusColor(skill.id))}
                      >
                        {getSkillStatusText(skill.id)}
                      </Badge>
                    </div>

                    {/* Skill notes (for mastered skills) */}
                    {skill.instructorNotes && (
                      <div className="mt-2 p-2 bg-white border rounded text-xs">
                        <p className="font-medium text-gray-700">Previous Notes:</p>
                        <p className="text-gray-600 mt-1">{skill.instructorNotes}</p>
                      </div>
                    )}

                    {/* Date mastered */}
                    {skill.dateMastered && (
                      <div className="mt-1 text-xs text-gray-500">
                        Mastered on: {new Date(skill.dateMastered).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkbox labels for non-readonly mode */}
                {!readOnly && (
                  <div className="flex gap-4 mt-2 ml-9">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`working-check-${skill.id}`}
                        checked={workingOn.includes(skill.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSkillToggle(skill.id, 'workingOn');
                          }
                        }}
                        disabled={mastered.includes(skill.id)}
                        className="h-3 w-3"
                      />
                      <Label
                        htmlFor={`working-check-${skill.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Working On
                      </Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`mastered-check-${skill.id}`}
                        checked={mastered.includes(skill.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSkillToggle(skill.id, 'mastered');
                          }
                        }}
                        disabled={workingOn.includes(skill.id)}
                        className="h-3 w-3"
                      />
                      <Label
                        htmlFor={`mastered-check-${skill.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Mastered
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Legend:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs">Mastered</span>
              </div>
              <div className="flex items-center gap-1">
                <CircleDot className="h-4 w-4 text-blue-500" />
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