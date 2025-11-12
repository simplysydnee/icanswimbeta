import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhotoPermissionSectionProps {
  formData: {
    photoVideoPermission: string;
    photoVideoSignature: string;
  };
  onChange: (field: string, value: string) => void;
}

export const PhotoPermissionSection = ({ formData, onChange }: PhotoPermissionSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo & Video Permission</CardTitle>
        <CardDescription>Media release authorization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="photoVideoPermission">
            Do you give permission for I CAN SWIM, LLC to use photos or videos of your swimmer for promotional or educational purposes (e.g., social media, website, flyers)?
          </Label>
          <Select
            value={formData.photoVideoPermission}
            onValueChange={(value) => onChange("photoVideoPermission", value)}
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
          <Label htmlFor="photoVideoSignature">Parent/Guardian Signature</Label>
          <Input
            id="photoVideoSignature"
            placeholder="Type your full name to sign"
            value={formData.photoVideoSignature}
            onChange={(e) => onChange("photoVideoSignature", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
