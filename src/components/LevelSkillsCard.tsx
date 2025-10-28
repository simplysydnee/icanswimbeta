import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillCheckbox } from "./SkillCheckbox";
import { ProgressBadge, SwimLevel } from "./ProgressBadge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface Skill {
  name: string;
  completed: boolean;
  dateMastered?: string;
}

interface LevelSkillsCardProps {
  level: SwimLevel;
  skills: Skill[];
  isActive?: boolean;
  isCompleted?: boolean;
  notes?: string;
}

export const LevelSkillsCard = ({ 
  level, 
  skills, 
  isActive = false,
  isCompleted = false,
  notes: initialNotes = ""
}: LevelSkillsCardProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const { isAdminOrInstructor, loading } = useUserRole();
  const completedCount = skills.filter(s => s.completed).length;
  const progressPercentage = (completedCount / skills.length) * 100;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
        <div className="flex items-center justify-between">
          <ProgressBadge 
            level={level} 
            isActive={isActive}
            isCompleted={isCompleted}
            size="md"
          />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold text-primary">
              {completedCount}/{skills.length}
            </p>
          </div>
        </div>
        <div className="mt-4 bg-muted rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {skills.map((skill, index) => (
          <SkillCheckbox
            key={index}
            skill={skill.name}
            isCompleted={skill.completed}
            dateMastered={skill.dateMastered}
          />
        ))}
        
        {!loading && isAdminOrInstructor && (
          <div className="mt-6 pt-6 border-t">
            <Label htmlFor={`notes-${level}`} className="text-sm font-semibold mb-2 block">
              Instructor Notes
            </Label>
            <Textarea
              id={`notes-${level}`}
              placeholder="Add progress notes, observations, or encouragement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
