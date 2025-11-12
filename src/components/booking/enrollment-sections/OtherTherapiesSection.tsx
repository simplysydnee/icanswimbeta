import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface OtherTherapiesSectionProps {
  formData: {
    otherTherapies: boolean;
    therapiesDescription: string;
  };
  onCheckboxChange: (field: string, checked: boolean) => void;
  onChange: (field: string, value: string) => void;
}

export const OtherTherapiesSection = ({ formData, onCheckboxChange, onChange }: OtherTherapiesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other Therapies</CardTitle>
        <CardDescription>Additional therapeutic services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="otherTherapies"
            checked={formData.otherTherapies}
            onCheckedChange={(checked) => onCheckboxChange("otherTherapies", checked as boolean)}
          />
          <Label htmlFor="otherTherapies" className="font-normal">
            Does your child receive other therapies? (e.g., OT, PT, Speech, ABA)
          </Label>
        </div>

        {formData.otherTherapies && (
          <div className="space-y-2">
            <Label htmlFor="therapiesDescription">Please describe the therapies:</Label>
            <Textarea
              id="therapiesDescription"
              placeholder="Describe the types of therapies, frequency, and any relevant details..."
              value={formData.therapiesDescription}
              onChange={(e) => onChange("therapiesDescription", e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
