'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, Shield, Lightbulb } from 'lucide-react';

interface GoalsStepProps {
  data: {
    swimSkillsGoals: string;
    safetyGoals: string;
  };
  onChange: (data: Partial<GoalsStepProps['data']>) => void;
}

export function GoalsStep({ data, onChange }: GoalsStepProps) {
  const handleSwimSkillsGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ swimSkillsGoals: e.target.value });
  };

  const handleSafetyGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ safetyGoals: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Goals Setting</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Set clear, achievable goals for swim skills and safety based on your assessment
        </p>
      </div>

      {/* Swim Skills Goals */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <Target className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <Label className="text-lg font-semibold">Swim Skills Goals</Label>
            <p className="text-sm text-muted-foreground">
              What specific swim skills should this swimmer work on?
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="swimSkillsGoals" className="text-sm font-medium">
            Goal(s) for Swim Skills
          </Label>
          <Textarea
            id="swimSkillsGoals"
            placeholder="Example:
• Improve front float for 10 seconds
• Learn to blow bubbles consistently
• Practice kicking with a kickboard
• Work on back float with minimal assistance"
            value={data.swimSkillsGoals}
            onChange={handleSwimSkillsGoalsChange}
            className="min-h-[150px]"
          />
          <div className="text-xs text-muted-foreground">
            Be specific and measurable. Focus on 2-3 key skills to work on.
          </div>
        </div>

        {/* Tips for Swim Skills Goals */}
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-cyan-800">
              <strong>Tips for effective swim skills goals:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Focus on foundational skills first (comfort, floating, breath control)</li>
                <li>• Make goals achievable within 4-8 lessons</li>
                <li>• Consider the swimmer's current abilities and challenges</li>
                <li>• Include both short-term (next lesson) and medium-term (next month) goals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Goals */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <Label className="text-lg font-semibold">Safety Goals</Label>
            <p className="text-sm text-muted-foreground">
              What safety skills should this swimmer develop?
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="safetyGoals" className="text-sm font-medium">
            Goal(s) for Safety
          </Label>
          <Textarea
            id="safetyGoals"
            placeholder="Example:
• Learn to exit pool independently
• Practice safe entry (sitting, then feet first)
• Understand and follow 'wait for permission' rule
• Learn to hold onto wall when tired"
            value={data.safetyGoals}
            onChange={handleSafetyGoalsChange}
            className="min-h-[150px]"
          />
          <div className="text-xs text-muted-foreground">
            Safety is our top priority. Focus on water safety and survival skills.
          </div>
        </div>

        {/* Tips for Safety Goals */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <strong>Essential safety skills to consider:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Safe entry and exit from pool</li>
                <li>• Understanding and following pool rules</li>
                <li>• Floating or treading water for survival</li>
                <li>• Getting to wall/side when in trouble</li>
                <li>• Calling for help appropriately</li>
                <li>• Understanding depth markers and boundaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Setting Guidelines */}
      <div className="mt-8 border rounded-lg p-4">
        <h4 className="font-medium mb-3">Goal Setting Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="font-medium text-sm">SMART Goals</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>S</strong>pecific - Clear and precise</li>
              <li>• <strong>M</strong>easurable - Can track progress</li>
              <li>• <strong>A</strong>chievable - Realistic for swimmer</li>
              <li>• <strong>R</strong>elevant - Aligns with needs</li>
              <li>• <strong>T</strong>ime-bound - Has timeframe</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-sm">Developmentally Appropriate</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Match swimmer's age and ability</li>
              <li>• Consider physical development</li>
              <li>• Account for any disabilities</li>
              <li>• Build on existing strengths</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-sm">Parent Communication</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Goals will be shared with parents</li>
              <li>• Use clear, non-technical language</li>
              <li>• Focus on positive progress</li>
              <li>• Suggest home practice if appropriate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}