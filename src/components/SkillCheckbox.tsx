import { useState } from "react";
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SkillCheckboxProps {
  skill: string;
  isCompleted?: boolean;
  dateMastered?: string;
  onToggle?: (completed: boolean) => void;
  onDateChange?: (date: string) => void;
}

export const SkillCheckbox = ({ 
  skill, 
  isCompleted = false,
  dateMastered = "",
  onToggle,
  onDateChange 
}: SkillCheckboxProps) => {
  const [checked, setChecked] = useState(isCompleted);
  const [date, setDate] = useState(dateMastered);

  const handleCheckedChange = (value: boolean) => {
    setChecked(value);
    if (value && !date) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      onDateChange?.(today);
    }
    onToggle?.(value);
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all",
      checked ? "bg-accent/10 border-accent" : "bg-card border-border hover:border-accent/50"
    )}>
      <Checkbox
        id={skill}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        className="h-5 w-5"
      />
      <div className="flex-1">
        <Label
          htmlFor={skill}
          className={cn(
            "cursor-pointer font-medium",
            checked && "text-accent"
          )}
        >
          {skill}
        </Label>
      </div>
      {checked && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Check className="h-4 w-4 text-success" />
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              onDateChange?.(e.target.value);
            }}
            className="w-36 h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
};
