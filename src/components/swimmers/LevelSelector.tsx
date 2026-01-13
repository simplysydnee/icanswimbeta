'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface SwimLevel {
  id: string;
  name: string;
  display_name: string;
  sequence: number;
  color?: string;
}

interface LevelSelectorProps {
  swimmerId: string;
  currentLevelId: string | null;
  onLevelChange?: (newLevelId: string) => void;
  disabled?: boolean;
}

export function LevelSelector({
  swimmerId,
  currentLevelId,
  onLevelChange,
  disabled = false
}: LevelSelectorProps) {
  const [levels, setLevels] = useState<SwimLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevelId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLevels, setIsFetchingLevels] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch all swim levels
  useEffect(() => {
    const fetchLevels = async () => {
      setIsFetchingLevels(true);
      try {
        const { data, error } = await supabase
          .from('swim_levels')
          .select('id, name, display_name, sequence, color')
          .order('sequence', { ascending: true });

        if (error) {
          console.error('Error fetching levels:', error);
          toast({
            title: 'Error',
            description: 'Failed to load swim levels',
            variant: 'destructive',
          });
          return;
        }
        setLevels(data || []);
      } catch (error) {
        console.error('Error fetching levels:', error);
      } finally {
        setIsFetchingLevels(false);
      }
    };
    fetchLevels();
  }, [supabase, toast]);

  // Update selected when prop changes
  useEffect(() => {
    setSelectedLevel(currentLevelId || '');
  }, [currentLevelId]);

  const handleLevelChange = async (newLevelId: string) => {
    if (newLevelId === selectedLevel) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('swimmers')
        .update({ current_level_id: newLevelId })
        .eq('id', swimmerId);

      if (error) throw error;

      setSelectedLevel(newLevelId);
      onLevelChange?.(newLevelId);

      const newLevel = levels.find(l => l.id === newLevelId);
      toast({
        title: 'Level Updated',
        description: `Swimmer moved to ${newLevel?.display_name || newLevel?.name || 'new level'}`,
      });
    } catch (error) {
      console.error('Error updating level:', error);
      toast({
        title: 'Error',
        description: 'Failed to update level',
        variant: 'destructive',
      });
      // Revert to previous value
      setSelectedLevel(currentLevelId || '');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingLevels) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Current Swim Level</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading levels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Current Swim Level</Label>
      {!selectedLevel ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 font-bold">!</span>
            </div>
            <div>
              <p className="font-medium text-amber-800">No Swim Level Assigned</p>
              <p className="text-xs text-amber-600">Assign a starting level to begin tracking progress</p>
            </div>
          </div>
          <Select
            value={selectedLevel}
            onValueChange={handleLevelChange}
            disabled={disabled || isLoading || isFetchingLevels}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Assign Starting Level..." />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: level.color || '#ccc' }} />
                    <span>{level.display_name || level.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          <Select
            value={selectedLevel}
            onValueChange={handleLevelChange}
            disabled={disabled || isLoading || isFetchingLevels}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: levels.find(l => l.id === selectedLevel)?.color || '#ccc'
                    }}
                  />
                  <span>
                    {levels.find(l => l.id === selectedLevel)?.display_name ||
                     levels.find(l => l.id === selectedLevel)?.name ||
                     'Current Level'}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: level.color || '#ccc' }} />
                    <span>{level.display_name || level.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating level...</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Change swimmer's level manually (e.g., if they skip a level or need adjustment)
          </p>
        </>
      )}
    </div>
  );
}