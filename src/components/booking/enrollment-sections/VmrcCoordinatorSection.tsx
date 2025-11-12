import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface VmrcCoordinatorSectionProps {
  formData: {
    vmrcCoordinatorName: string;
    vmrcCoordinatorEmail: string;
    vmrcCoordinatorPhone: string;
  };
  onChange: (field: string, value: string) => void;
}

export const VmrcCoordinatorSection = ({ formData, onChange }: VmrcCoordinatorSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>VMRC Coordinator Information</CardTitle>
        <CardDescription>Your assigned VMRC coordinator details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vmrcCoordinatorName">VMRC Coordinator Name</Label>
          <Input
            id="vmrcCoordinatorName"
            placeholder="Enter coordinator name"
            value={formData.vmrcCoordinatorName}
            onChange={(e) => onChange("vmrcCoordinatorName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vmrcCoordinatorEmail">VMRC Coordinator Email</Label>
          <Input
            id="vmrcCoordinatorEmail"
            type="email"
            placeholder="coordinator@example.com"
            value={formData.vmrcCoordinatorEmail}
            onChange={(e) => onChange("vmrcCoordinatorEmail", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vmrcCoordinatorPhone">VMRC Coordinator Phone</Label>
          <Input
            id="vmrcCoordinatorPhone"
            type="tel"
            placeholder="(555) 555-5555"
            value={formData.vmrcCoordinatorPhone}
            onChange={(e) => onChange("vmrcCoordinatorPhone", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
