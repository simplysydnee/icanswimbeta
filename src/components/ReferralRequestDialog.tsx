import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralRequestDialogProps {
  trigger?: React.ReactNode;
}

export const ReferralRequestDialog = ({ trigger }: ReferralRequestDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childAge: "",
    referralType: "",
    coordinatorName: "",
    coordinatorEmail: "",
    previousSwimLessons: "",
    swimGoals: [] as string[],
    strengthsInterests: "",
    motivationFactors: "",
    availabilityGeneral: [] as string[],
    availabilityOther: "",
    photoRelease: "",
    liabilityAgreement: false,
    additionalInfo: "",
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.liabilityAgreement) {
      toast({
        title: "Agreement Required",
        description: "Please accept the liability agreement to continue",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      let photoUrl = null;
      
      // Upload photo if provided
      if (photoFile) {
        setPhotoUploading(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `referral-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vmrc-referrals')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vmrc-referrals')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
        setPhotoUploading(false);
      }

      const { data, error } = await supabase.functions.invoke('send-referral-request', {
        body: {
          ...formData,
          swimmerPhotoUrl: photoUrl,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Referral Request Submitted! 📧",
        description: "Your coordinator will review your request and contact you within 24-48 hours.",
      });

      // Reset form and close dialog
      setFormData({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        referralType: "",
        coordinatorName: "",
        coordinatorEmail: "",
        previousSwimLessons: "",
        swimGoals: [],
        strengthsInterests: "",
        motivationFactors: "",
        availabilityGeneral: [],
        availabilityOther: "",
        photoRelease: "",
        liabilityAgreement: false,
        additionalInfo: "",
      });
      setPhotoFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Referral request error:", error);
      toast({
        title: "Error",
        description: "Failed to submit referral request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setPhotoUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" variant="outline">
            <Heart className="mr-2 h-5 w-5" />
            Request VMRC Referral
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Enrollment</DialogTitle>
          <DialogDescription>
            Please complete all required fields to submit your VMRC referral request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Parent/Guardian Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input
                id="parentName"
                required
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email Address *</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  required
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone">Phone Number *</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  required
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Child Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Child Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name *</Label>
                <Input
                  id="childName"
                  required
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="Child's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="childAge">Child's Age *</Label>
                <Input
                  id="childAge"
                  type="number"
                  min={1}
                  max={18}
                  required
                  value={formData.childAge}
                  onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                  placeholder="Age in years"
                />
              </div>
            </div>
          </div>

          {/* Referral Type */}
          <div className="space-y-2">
            <Label htmlFor="referralType">Referral Type *</Label>
            <Select
              value={formData.referralType}
              onValueChange={(value) => setFormData({ ...formData, referralType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select referral type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vmrc">VMRC Client</SelectItem>
                <SelectItem value="scholarship">Scholarship Applicant</SelectItem>
                <SelectItem value="coordinator">Coordinator Referral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coordinator Information */}
          {formData.referralType === "vmrc" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm">VMRC Coordinator Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="coordinatorName">Coordinator Name *</Label>
                <Input
                  id="coordinatorName"
                  required={formData.referralType === "vmrc"}
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Your VMRC coordinator's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinatorEmail">Coordinator Email *</Label>
                <Input
                  id="coordinatorEmail"
                  type="email"
                  required={formData.referralType === "vmrc"}
                  value={formData.coordinatorEmail}
                  onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                  placeholder="coordinator@example.com"
                />
              </div>
            </div>
          )}

          {/* Enrollment Questions */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Enrollment Questions</h3>
            
            {/* Previous Swim Lessons */}
            <div className="space-y-2">
              <Label htmlFor="previousSwimLessons">Has your child previously taken swim lessons? *</Label>
              <Select
                value={formData.previousSwimLessons}
                onValueChange={(value) => setFormData({ ...formData, previousSwimLessons: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="yes/no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Swim Goals */}
            <div className="space-y-2">
              <Label>What swim skills and water safety skills would you like your child to develop? *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-lg">
                {["Water comfort", "Floating", "Breathing techniques", "Front crawl", "Backstroke", "Treading water", "Water safety", "Diving"].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={formData.swimGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, swimGoals: [...formData.swimGoals, goal] });
                        } else {
                          setFormData({ ...formData, swimGoals: formData.swimGoals.filter(g => g !== goal) });
                        }
                      }}
                    />
                    <Label htmlFor={`goal-${goal}`} className="font-normal cursor-pointer">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Interests */}
            <div className="space-y-2">
              <Label htmlFor="strengthsInterests">Please describe your child&apos;s strengths, interests, and favorite activities *</Label>
              <Textarea
                id="strengthsInterests"
                required
                value={formData.strengthsInterests}
                onChange={(e) => setFormData({ ...formData, strengthsInterests: e.target.value })}
                rows={3}
              />
            </div>

            {/* Motivation Factors */}
            <div className="space-y-2">
              <Label htmlFor="motivationFactors">What kinds of things motivate your child and encourage positive behavior, especially in a pool environment? *</Label>
              <Textarea
                id="motivationFactors"
                required
                value={formData.motivationFactors}
                onChange={(e) => setFormData({ ...formData, motivationFactors: e.target.value })}
                placeholder="For example, do they respond well to praise, stickers, or specific toys?"
                rows={3}
              />
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <Label>What is your general availability for swim lessons? *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg">
                {["Monday AM", "Monday PM", "Tuesday AM", "Tuesday PM", "Wednesday AM", "Wednesday PM", "Thursday AM", "Thursday PM", "Friday AM", "Friday PM", "Saturday AM", "Saturday PM", "Sunday AM", "Sunday PM"].map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`avail-${time}`}
                      checked={formData.availabilityGeneral.includes(time)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, availabilityGeneral: [...formData.availabilityGeneral, time] });
                        } else {
                          setFormData({ ...formData, availabilityGeneral: formData.availabilityGeneral.filter(t => t !== time) });
                        }
                      }}
                    />
                    <Label htmlFor={`avail-${time}`} className="font-normal text-sm cursor-pointer">
                      {time}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Other */}
            <div className="space-y-2">
              <Label htmlFor="availabilityOther">Availability Other (please specify)</Label>
              <Textarea
                id="availabilityOther"
                value={formData.availabilityOther}
                onChange={(e) => setFormData({ ...formData, availabilityOther: e.target.value })}
                rows={2}
              />
            </div>

            {/* Photo Release */}
            <div className="space-y-2">
              <Label htmlFor="photoRelease">Do you give permission for I CAN SWIM, LLC to use photos or videos of your swimmer for promotional or educational purposes (e.g., social media, website, flyers)? *</Label>
              <Select
                value={formData.photoRelease}
                onValueChange={(value) => setFormData({ ...formData, photoRelease: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liability Agreement */}
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="liabilityAgreement"
                  checked={formData.liabilityAgreement}
                  onCheckedChange={(checked) => setFormData({ ...formData, liabilityAgreement: checked as boolean })}
                  required
                />
                <div className="space-y-1">
                  <Label htmlFor="liabilityAgreement" className="cursor-pointer">
                    I HEREBY CERTIFY that I am the parent or guardian, named above, and do hereby give my consent without reservation to the foregoing on behalf of this individual. *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Read and Review Release of Liability:{" "}
                    <a 
                      href="https://docs.google.com/document/d/1KCvC4qmNnnjRH6eYmPoaLrZgiEQx0oXNyY/edit?usp=sharing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Document
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Swimmer Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="swimmerPhoto">Upload a photo of your swimmer</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="swimmerPhoto"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="swimmerPhoto" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {photoFile ? photoFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Any additional details about your child's needs, goals, or special considerations..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || photoUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || photoUploading}>
              <Send className="mr-2 h-4 w-4" />
              {photoUploading ? "Uploading photo..." : loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
