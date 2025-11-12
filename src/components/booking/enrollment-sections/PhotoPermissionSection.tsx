import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PhotoPermissionSectionProps {
  formData: {
    photoVideoPermission: boolean;
    socialMediaConsent: boolean;
  };
  onCheckboxChange: (field: string, checked: boolean) => void;
}

export const PhotoPermissionSection = ({ formData, onCheckboxChange }: PhotoPermissionSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo & Video Permissions</CardTitle>
        <CardDescription>Media consent and usage permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="photoVideoPermission"
            checked={formData.photoVideoPermission}
            onCheckedChange={(checked) => onCheckboxChange("photoVideoPermission", checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="photoVideoPermission" className="font-normal">
              I give permission for photos and videos to be taken of my child during swim lessons
            </Label>
            <p className="text-sm text-muted-foreground">
              Photos and videos may be used for progress tracking, instructor training, and program improvement purposes.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="socialMediaConsent"
            checked={formData.socialMediaConsent}
            onCheckedChange={(checked) => onCheckboxChange("socialMediaConsent", checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="socialMediaConsent" className="font-normal">
              I consent to photos and videos being used on social media and marketing materials
            </Label>
            <p className="text-sm text-muted-foreground">
              This includes use on websites, social media platforms, promotional materials, and advertisements. Your child's name will not be used without additional permission.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
