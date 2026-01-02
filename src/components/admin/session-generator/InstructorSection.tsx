'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructors } from '@/hooks';

interface InstructorSectionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Instructor multi-select section
 * Fetches instructors and displays as checkboxes
 */
export function InstructorSection({ selectedIds, onChange }: InstructorSectionProps) {
  const { data: instructors, isLoading, error } = useInstructors();

  // Toggle single instructor
  const toggleInstructor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Select all instructors
  const selectAll = () => {
    if (instructors) {
      onChange(instructors.map(i => i.id));
    }
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Instructors</Label>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">Failed to load instructors</p>
      )}

      {instructors && instructors.length === 0 && (
        <p className="text-sm text-muted-foreground">No instructors found</p>
      )}

      {instructors && instructors.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
          {instructors.map((instructor) => (
            <label
              key={instructor.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                transition-colors
                ${selectedIds.includes(instructor.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
                }
              `}
            >
              <Checkbox
                checked={selectedIds.includes(instructor.id)}
                onCheckedChange={() => toggleInstructor(instructor.id)}
              />
              <span className="font-medium">{instructor.fullName}</span>
            </label>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} instructor{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}