import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CancellationPolicySectionProps {
  formData: {
    cancellationPolicySignature: string;
  };
  onViewPolicy: () => void;
  onChange: (field: string, value: string) => void;
}

export const CancellationPolicySection = ({ formData, onViewPolicy, onChange }: CancellationPolicySectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancellation Policy</CardTitle>
        <CardDescription>Review and agree to the cancellation policy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="link" onClick={onViewPolicy} className="p-0 h-auto">
          View Cancellation Policy
        </Button>

        <div className="space-y-2">
          <Label htmlFor="cancellationPolicySignature">
            Parent/Guardian Signature *
          </Label>
          <Input
            id="cancellationPolicySignature"
            value={formData.cancellationPolicySignature}
            onChange={(e) => onChange("cancellationPolicySignature", e.target.value)}
            placeholder="Type your full legal name"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};
