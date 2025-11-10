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
    // Client Information
    childName: "",
    childDateOfBirth: "",
    diagnosis: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    
    // Medical & Physical Profile
    nonAmbulatory: "",
    hasSeizureDisorder: "",
    height: "",
    weight: "",
    toiletTrained: "",
    hasMedicalConditions: "",
    medicalConditionsDescription: "",
    hasAllergies: "",
    allergiesDescription: "",
    hasOtherTherapies: "",
    otherTherapiesDescription: "",
    
    // Behavioral & Safety
    comfortableInWater: "",
    selfInjuriousBehavior: "",
    selfInjuriousDescription: "",
    aggressiveBehavior: "",
    aggressiveBehaviorDescription: "",
    elopementBehavior: "",
    elopementDescription: "",
    hasSafetyPlan: "",
    safetyPlanDescription: "",
    
    // Referral & consent
    referralType: "",
    coordinatorName: "",
    coordinatorEmail: "",
    photoRelease: "",
    liabilityAgreement: false,
    
    // Optional fields retained
    previousSwimLessons: "",
    swimGoals: [] as string[],
    strengthsInterests: "",
    availabilityGeneral: [] as string[],
    availabilityOther: "",
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
        childName: "",
        childDateOfBirth: "",
        diagnosis: "",
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        nonAmbulatory: "",
        hasSeizureDisorder: "",
        height: "",
        weight: "",
        toiletTrained: "",
        hasMedicalConditions: "",
        medicalConditionsDescription: "",
        hasAllergies: "",
        allergiesDescription: "",
        hasOtherTherapies: "",
        otherTherapiesDescription: "",
        comfortableInWater: "",
        selfInjuriousBehavior: "",
        selfInjuriousDescription: "",
        aggressiveBehavior: "",
        aggressiveBehaviorDescription: "",
        elopementBehavior: "",
        elopementDescription: "",
        hasSafetyPlan: "",
        safetyPlanDescription: "",
        referralType: "",
        coordinatorName: "",
        coordinatorEmail: "",
        photoRelease: "",
        liabilityAgreement: false,
        previousSwimLessons: "",
        swimGoals: [],
        strengthsInterests: "",
        availabilityGeneral: [],
        availabilityOther: "",
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Client Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="childName">Client Name *</Label>
              <Input
                id="childName"
                required
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childDateOfBirth">Date of Birth *</Label>
              <Input
                id="childDateOfBirth"
                type="date"
                required
                value={formData.childDateOfBirth}
                onChange={(e) => setFormData({ ...formData, childDateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Select
                value={formData.diagnosis}
                onValueChange={(value) => setFormData({ ...formData, diagnosis: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diagnosis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD/ADHD">ADD/ADHD</SelectItem>
                  <SelectItem value="Autism">Autism</SelectItem>
                  <SelectItem value="Developmental Disability">Developmental Disability</SelectItem>
                  <SelectItem value="Learning Disability">Learning Disability</SelectItem>
                  <SelectItem value="Sensory Processing">Sensory Processing</SelectItem>
                  <SelectItem value="Speech Delay">Speech Delay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name *</Label>
              <Input
                id="parentName"
                required
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email *</Label>
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

          {/* Client Medical and Physical Profile Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg border-b pb-2">Client Medical and Physical Profile</h3>
            
            <div className="space-y-2">
              <Label htmlFor="nonAmbulatory">Does the child use a wheelchair or have difficulty walking or moving independently? *</Label>
              <Select
                value={formData.nonAmbulatory}
                onValueChange={(value) => setFormData({ ...formData, nonAmbulatory: value })}
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

            <div className="space-y-2">
              <Label htmlFor="hasSeizureDisorder">Does the child have a seizure disorder? *</Label>
              <Select
                value={formData.hasSeizureDisorder}
                onValueChange={(value) => setFormData({ ...formData, hasSeizureDisorder: value })}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height *</Label>
                <Input
                  id="height"
                  required
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g., 4'5&quot;"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight *</Label>
                <Input
                  id="weight"
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 65 lbs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toiletTrained">Is the child toilet trained? *</Label>
              <Select
                value={formData.toiletTrained}
                onValueChange={(value) => setFormData({ ...formData, toiletTrained: value })}
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

            <div className="space-y-2">
              <Label htmlFor="hasMedicalConditions">Medical conditions *</Label>
              <Select
                value={formData.hasMedicalConditions}
                onValueChange={(value) => {
                  setFormData({ ...formData, hasMedicalConditions: value });
                  if (value === "no") setFormData({ ...formData, hasMedicalConditions: value, medicalConditionsDescription: "" });
                }}
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

            {formData.hasMedicalConditions === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="medicalConditionsDescription">Please describe *</Label>
                <Textarea
                  id="medicalConditionsDescription"
                  required
                  value={formData.medicalConditionsDescription}
                  onChange={(e) => setFormData({ ...formData, medicalConditionsDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hasAllergies">Allergies *</Label>
              <Select
                value={formData.hasAllergies}
                onValueChange={(value) => {
                  setFormData({ ...formData, hasAllergies: value });
                  if (value === "no") setFormData({ ...formData, hasAllergies: value, allergiesDescription: "" });
                }}
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

            {formData.hasAllergies === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="allergiesDescription">Please describe *</Label>
                <Textarea
                  id="allergiesDescription"
                  required
                  value={formData.allergiesDescription}
                  onChange={(e) => setFormData({ ...formData, allergiesDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hasOtherTherapies">Other therapies *</Label>
              <Select
                value={formData.hasOtherTherapies}
                onValueChange={(value) => {
                  setFormData({ ...formData, hasOtherTherapies: value });
                  if (value === "no") setFormData({ ...formData, hasOtherTherapies: value, otherTherapiesDescription: "" });
                }}
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

            {formData.hasOtherTherapies === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="otherTherapiesDescription">Please describe *</Label>
                <Textarea
                  id="otherTherapiesDescription"
                  required
                  value={formData.otherTherapiesDescription}
                  onChange={(e) => setFormData({ ...formData, otherTherapiesDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Behavioral & Safety Information Section */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="font-semibold text-lg border-b pb-2">Behavioral & Safety Information</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Help us ensure a safe and successful experience for both the client and our I Can Swim team by completing this section. Your information allows us to prepare properly and support the client's needs while keeping everyone safe.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comfortableInWater">Is the child comfortable in water? *</Label>
              <Select
                value={formData.comfortableInWater}
                onValueChange={(value) => setFormData({ ...formData, comfortableInWater: value })}
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

            <div className="space-y-2">
              <Label htmlFor="selfInjuriousBehavior">Does the child engage in any self-injurious behaviors? *</Label>
              <Select
                value={formData.selfInjuriousBehavior}
                onValueChange={(value) => {
                  setFormData({ ...formData, selfInjuriousBehavior: value });
                  if (value === "no") setFormData({ ...formData, selfInjuriousBehavior: value, selfInjuriousDescription: "" });
                }}
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

            {formData.selfInjuriousBehavior === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="selfInjuriousDescription">Please describe *</Label>
                <Textarea
                  id="selfInjuriousDescription"
                  required
                  value={formData.selfInjuriousDescription}
                  onChange={(e) => setFormData({ ...formData, selfInjuriousDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="aggressiveBehavior">Has the child displayed physically aggressive behavior toward others? *</Label>
              <Select
                value={formData.aggressiveBehavior}
                onValueChange={(value) => {
                  setFormData({ ...formData, aggressiveBehavior: value });
                  if (value === "no") setFormData({ ...formData, aggressiveBehavior: value, aggressiveBehaviorDescription: "" });
                }}
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

            {formData.aggressiveBehavior === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="aggressiveBehaviorDescription">Please describe *</Label>
                <Textarea
                  id="aggressiveBehaviorDescription"
                  required
                  value={formData.aggressiveBehaviorDescription}
                  onChange={(e) => setFormData({ ...formData, aggressiveBehaviorDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="elopementBehavior">Does the child exhibit elopement behaviors (running away or wandering)? *</Label>
              <Select
                value={formData.elopementBehavior}
                onValueChange={(value) => {
                  setFormData({ ...formData, elopementBehavior: value });
                  if (value === "no") setFormData({ ...formData, elopementBehavior: value, elopementDescription: "" });
                }}
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

            {formData.elopementBehavior === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="elopementDescription">Please describe *</Label>
                <Textarea
                  id="elopementDescription"
                  required
                  value={formData.elopementDescription}
                  onChange={(e) => setFormData({ ...formData, elopementDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hasSafetyPlan">Does the child have a safety plan or behavior intervention plan (BIP) in place? *</Label>
              <Select
                value={formData.hasSafetyPlan}
                onValueChange={(value) => {
                  setFormData({ ...formData, hasSafetyPlan: value });
                  if (value === "no") setFormData({ ...formData, hasSafetyPlan: value, safetyPlanDescription: "" });
                }}
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

            {formData.hasSafetyPlan === "yes" && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="safetyPlanDescription">Please describe *</Label>
                <Textarea
                  id="safetyPlanDescription"
                  required
                  value={formData.safetyPlanDescription}
                  onChange={(e) => setFormData({ ...formData, safetyPlanDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Referral Type & Coordinator Info */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg border-b pb-2">Referral Information</h3>
            
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

            {formData.referralType === "vmrc" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm">VMRC Coordinator Information</h4>
                
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
          </div>

          {/* Photo Release & Liability */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="photoRelease">Do you give permission for I CAN SWIM, LLC to use photos or videos of your swimmer for promotional or educational purposes? *</Label>
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
                    I HEREBY CERTIFY that I am the parent or guardian and consent to the foregoing on behalf of this individual. *
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
              <Label htmlFor="swimmerPhoto">Upload a photo of your swimmer (optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="swimmerPhoto"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="swimmerPhoto" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {photoFile ? photoFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information (optional)</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={3}
                placeholder="Any other information you'd like to share..."
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || photoUploading}
          >
            {photoUploading ? (
              <>Uploading Photo...</>
            ) : loading ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Referral Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
