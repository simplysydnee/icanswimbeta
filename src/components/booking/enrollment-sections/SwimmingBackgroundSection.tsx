import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SWIM_GOALS = [
  "Develop comfort and familiarity with water",
  "Front crawl",
  "Backstroke",
  "Improve basic water safety skills (e.g. floating, treading water)",
  "Learn basic swimming strokes (e.g. front stroke)",
  "Learn to swim with flotation device",
  "Become comfortable in water",
  "Enter and exit water",
  "To float on back",
  "Perform basic arm and leg movement",
  "Tread water",
];

interface SwimmingBackgroundSectionProps {
  formData: {
    previousSwimLessons: boolean;
    comfortableInWater: string;
    swimGoals: string[];
  };
  onMultiSelectToggle: (field: string, value: string) => void;
  onChange: (field: string, value: any) => void;
}

export const SwimmingBackgroundSection = ({ formData, onMultiSelectToggle, onChange }: SwimmingBackgroundSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Swimming Background & Goals</CardTitle>
        <CardDescription>Previous experience and learning objectives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Has your child previously taken swim lessons?</Label>
          <Select
            value={formData.previousSwimLessons ? "yes" : "no"}
            onValueChange={(value) => onChange("previousSwimLessons", value === "yes")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comfortableInWater">Comfortable in Water</Label>
          <Select value={formData.comfortableInWater} onValueChange={(value) => onChange("comfortableInWater", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select comfort level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="very_comfortable">Very Comfortable</SelectItem>
              <SelectItem value="somewhat_comfortable">Somewhat Comfortable</SelectItem>
              <SelectItem value="not_comfortable">Not Comfortable</SelectItem>
              <SelectItem value="afraid">Afraid of Water</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>What swim skills and water safety skills would you like your child to develop? (select all that apply)</Label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
            {SWIM_GOALS.map((goal) => (
              <div key={goal} className="flex items-start space-x-2">
                <Checkbox
                  id={`goal-${goal}`}
                  checked={formData.swimGoals.includes(goal)}
                  onCheckedChange={() => onMultiSelectToggle("swimGoals", goal)}
                />
                <Label htmlFor={`goal-${goal}`} className="font-normal text-sm">{goal}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
