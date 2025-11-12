import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LiabilityWaiverSectionProps {
  formData: {
    liabilityWaiverSignature: string;
  };
  onViewWaiver: () => void;
  onChange: (field: string, value: string) => void;
}

export const LiabilityWaiverSection = ({ formData, onViewWaiver, onChange }: LiabilityWaiverSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liability Waiver</CardTitle>
        <CardDescription>Review and sign the liability waiver</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="link" onClick={onViewWaiver} className="p-0 h-auto">
          View Liability Waiver
        </Button>

        <div className="space-y-2">
          <Label htmlFor="liabilityWaiverSignature">
            Parent/Guardian Signature *
          </Label>
          <Input
            id="liabilityWaiverSignature"
            value={formData.liabilityWaiverSignature}
            onChange={(e) => onChange("liabilityWaiverSignature", e.target.value)}
            placeholder="Type your full legal name"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};
