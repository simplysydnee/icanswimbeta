import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FunctionalInfoSectionProps {
  formData: {
    toiletTrained: boolean;
    nonAmbulatory: boolean;
    communicationType: string;
    strengthsInterests: string;
    motivators: string;
  };
  onCheckboxChange: (field: string, checked: boolean) => void;
  onChange: (field: string, value: any) => void;
}

export const FunctionalInfoSection = ({ formData, onCheckboxChange, onChange }: FunctionalInfoSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Functional Information</CardTitle>
        <CardDescription>Communication and daily living skills</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Toilet Trained?</Label>
          <Select
            value={formData.toiletTrained === undefined ? "" : formData.toiletTrained.toString()}
            onValueChange={(value) => onChange("toiletTrained", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="nonAmbulatory"
            checked={formData.nonAmbulatory}
            onCheckedChange={(checked) => onCheckboxChange("nonAmbulatory", checked as boolean)}
          />
          <Label htmlFor="nonAmbulatory" className="font-normal">Non-ambulatory (requires mobility assistance)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="communicationType">Type of Communication</Label>
          <Select value={formData.communicationType} onValueChange={(value) => onChange("communicationType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select communication type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verbal">Verbal</SelectItem>
              <SelectItem value="signs">Sign Language</SelectItem>
              <SelectItem value="gestures">Gestures</SelectItem>
              <SelectItem value="pecs_aac">PECS/AAC Device</SelectItem>
              <SelectItem value="non_verbal">Non-verbal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="strengthsInterests">Please describe your child's strengths, interests, and favorite activities.</Label>
          <Textarea
            id="strengthsInterests"
            placeholder="Describe your child's strengths, interests, and favorite activities..."
            value={formData.strengthsInterests}
            onChange={(e) => onChange("strengthsInterests", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivators">What kinds of things motivate your child and encourage positive behavior, especially in a pool environment?</Label>
          <Textarea
            id="motivators"
            placeholder="e.g., Praise, toys, specific activities, rewards..."
            value={formData.motivators}
            onChange={(e) => onChange("motivators", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
