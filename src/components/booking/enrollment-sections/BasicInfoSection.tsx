import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

interface BasicInfoSectionProps {
  formData: {
    parentPhone: string;
    gender: string;
    height: string;
    weight: string;
  };
  onChange: (field: string, value: string) => void;
}

export const BasicInfoSection = ({ formData, onChange }: BasicInfoSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Child Details</CardTitle>
        <CardDescription>Basic information about the swimmer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Phone Number</Label>
            <Input
              id="parentPhone"
              placeholder="(555) 123-4567"
              value={formData.parentPhone}
              onChange={(e) => onChange("parentPhone", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Child's Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => onChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              placeholder="e.g., 4'2&quot;"
              value={formData.height}
              onChange={(e) => onChange("height", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              placeholder="e.g., 65 lbs"
              value={formData.weight}
              onChange={(e) => onChange("weight", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Upload a photo of your swimmer</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
