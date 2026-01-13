'use client';

import { useState } from 'react';
import { CheckCircle, Circle, CircleDot, MessageSquare, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SwimSkill {
  id: string;
  name: string;
  description?: string;
  sequence: number;
}

interface SwimmerSkill {
  id: string;
  skill: SwimSkill;
  status: 'not_started' | 'in_progress' | 'mastered';
  dateMastered?: string;
  dateStarted?: string;
  instructorNotes?: string;
  updatedAt?: string;
}

interface InlineSkillEditorProps {
  skill: SwimmerSkill;
  onStatusChange: (skillId: string, newStatus: 'not_started' | 'in_progress' | 'mastered', notes?: string) => Promise<void>;
  readOnly?: boolean;
}

export function InlineSkillEditor({ skill, onStatusChange, readOnly = false }: InlineSkillEditorProps) {
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(skill.instructorNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(skill.status);

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-gray-400' },
    { value: 'in_progress', label: 'In Progress', icon: CircleDot, color: 'text-yellow-500' },
    { value: 'mastered', label: 'Mastered', icon: CheckCircle, color: 'text-green-500' },
  ];

  const handleStatusChange = async (newStatus: 'not_started' | 'in_progress' | 'mastered') => {
    if (readOnly) return;

    setIsSaving(true);
    try {
      await onStatusChange(skill.id, newStatus, notes);
      setCurrentStatus(newStatus);
      toast({
        title: 'Skill updated',
        description: `${skill.skill.name} marked as ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to update skill status',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (readOnly) return;

    setIsSaving(true);
    try {
      await onStatusChange(skill.id, currentStatus, notes);
      setIsEditingNotes(false);
      toast({
        title: 'Notes saved',
        description: 'Instructor notes updated',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatusOption = statusOptions.find(opt => opt.value === currentStatus);

  return (
    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{skill.skill.name}</span>
            {skill.skill.description && (
              <span className="text-xs text-muted-foreground truncate hidden md:inline">
                {skill.skill.description}
              </span>
            )}
          </div>
          {skill.dateMastered && (
            <div className="text-xs text-muted-foreground mt-1">
              Mastered: {new Date(skill.dateMastered).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {readOnly ? (
            <Badge
              className={cn(
                currentStatus === 'mastered' && 'bg-green-100 text-green-800 hover:bg-green-100',
                currentStatus === 'in_progress' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
                currentStatus === 'not_started' && 'bg-gray-100 text-gray-800 hover:bg-gray-100'
              )}
            >
              {currentStatus.replace('_', ' ')}
            </Badge>
          ) : (
            <Select
              value={currentStatus}
              onValueChange={(value: 'not_started' | 'in_progress' | 'mastered') => handleStatusChange(value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-32">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {currentStatusOption && (
                      <>
                        <currentStatusOption.icon className={cn('h-3 w-3', currentStatusOption.color)} />
                        <span>{currentStatusOption.label}</span>
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={cn('h-3 w-3', option.color)} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            disabled={readOnly || isSaving}
            className="h-8 w-8 p-0"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditingNotes && !readOnly && (
        <div className="mt-3 pt-3 border-t">
          <Textarea
            placeholder="Add instructor notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditingNotes(false);
                setNotes(skill.instructorNotes || '');
              }}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              Save Notes
            </Button>
          </div>
        </div>
      )}

      {!isEditingNotes && skill.instructorNotes && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Notes: {skill.instructorNotes}</p>
        </div>
      )}
    </div>
  );
}