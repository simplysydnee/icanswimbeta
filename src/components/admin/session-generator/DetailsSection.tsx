'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOCATIONS } from '@/config/constants';
import { useSwimLevels } from '@/hooks';

interface DetailsSectionProps {
  location: string;
  maxCapacity: number;
  selectedSwimLevels: string[];
  notes: string;
  onLocationChange: (location: string) => void;
  onMaxCapacityChange: (capacity: number) => void;
  onSwimLevelsChange: (levels: string[]) => void;
  onNotesChange: (notes: string) => void;
}

/**
 * Session details section
 * Location, max capacity, swim levels, and notes
 */
export function DetailsSection({
  location,
  maxCapacity,
  selectedSwimLevels,
  notes,
  onLocationChange,
  onMaxCapacityChange,
  onSwimLevelsChange,
  onNotesChange,
}: DetailsSectionProps) {
  const { data: swimLevels, isLoading: loadingLevels } = useSwimLevels();

  // Toggle swim level
  const toggleLevel = (levelId: string) => {
    if (selectedSwimLevels.includes(levelId)) {
      onSwimLevelsChange(selectedSwimLevels.filter(l => l !== levelId));
    } else {
      onSwimLevelsChange([...selectedSwimLevels, levelId]);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Session Details</Label>

      {/* Location and Max Capacity in a row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm">Location</Label>
          <Select value={location} onValueChange={onLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Capacity */}
        <div className="space-y-2">
          <Label className="text-sm">Max Swimmers per Session</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxCapacity}
            onChange={(e) => onMaxCapacityChange(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* Allowed Swim Levels */}
      <div className="space-y-2">
        <Label className="text-sm">Allowed Swim Levels</Label>
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all levels
        </p>

        {loadingLevels && (
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}

        {swimLevels && (
          <div className="flex flex-wrap gap-2">
            {swimLevels.map((level) => (
              <label
                key={level.id}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer
                  text-sm transition-colors
                  ${selectedSwimLevels.includes(level.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted hover:border-muted-foreground/50'
                  }
                `}
              >
                <Checkbox
                  checked={selectedSwimLevels.includes(level.id)}
                  onCheckedChange={() => toggleLevel(level.id)}
                  className="h-3.5 w-3.5"
                />
                {level.displayName || level.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm">Notes (optional)</Label>
        <Textarea
          placeholder="Any additional notes for these sessions..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}