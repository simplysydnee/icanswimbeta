import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { swimmersApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LiabilityWaiverModal } from "@/components/LiabilityWaiverModal";
import { CancellationPolicyAgreementModal } from "@/components/CancellationPolicyAgreementModal";
import {
  BasicInfoSection,
  MedicalSafetySection,
  SwimmingBackgroundSection,
  FunctionalInfoSection,
  OtherTherapiesSection,
  VmrcCoordinatorSection,
  SchedulingSection,
  PhotoPermissionSection,
  LiabilityWaiverSection,
  CancellationPolicySection
} from './enrollment-sections';

interface EnrollmentTabProps {
  swimmerId?: string;
}

const DIAGNOSIS_OPTIONS = [
  "Autism",
  "Speech Delay",
  "ADD/ADHD",
  "Sensory Processing",
  "Developmental Disability",
  "Learning Disability",
];

const SWIM_GOALS = [
  "Develop comfort and familiarity with water",
  "Front crawl",
  "Backstroke",
  "Improve basic water safety skills (e.g. floating, treading water)",
  "Learn basic swimming strokes (e.g. front stroke)",
  "Learn to swim with flotation device",
  "Become comfortable in water",
  "Enter and exit water",
  "To float on back",
  "Perform basic arm and leg movement",
  "Tread water",
];

const AVAILABILITY_SLOTS = [
  "Flexible – I can adjust my schedule if needed",
  "Weekday Mornings (8 AM- 12 PM)",
  "Weekday Afternoons (12 PM – 4 PM)",
  "Weekday Evenings (4 PM – 7 PM)",
  "Saturday Availability",
  "Sunday Availability",
  "Other (please specify)",
];

export const EnrollmentTab = ({ swimmerId }: EnrollmentTabProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);
  const [cancellationPolicyModalOpen, setCancellationPolicyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    parentPhone: "",
    gender: "",
    height: "",
    weight: "",
    
    // Medical & Safety
    historyOfSeizures: false,
    hasAllergies: false,
    allergiesDescription: "",
    hasMedicalConditions: false,
    medicalConditionsDescription: "",
    diagnosis: [] as string[],
    selfInjuriousBehavior: false,
    selfInjuriousDescription: "",
    aggressiveBehavior: false,
    aggressiveBehaviorDescription: "",
    elopementHistory: false,
    elopementDescription: "",
    hasBehaviorPlan: false,
    behaviorPlanDescription: "",
    restraintHistory: false,
    restraintDescription: "",
    
    // Swimming Background
    previousSwimLessons: false,
    comfortableInWater: "",
    swimGoals: [] as string[],
    
    // Functional Info
    toiletTrained: undefined as boolean | undefined,
    nonAmbulatory: false,
    communicationType: "",
    strengthsInterests: "",
    motivators: "",
    
    // Other Therapies
    otherTherapies: false,
    therapiesDescription: "",
    
    // VMRC Info
    vmrcCoordinatorName: "",
    vmrcCoordinatorEmail: "",
    vmrcCoordinatorPhone: "",
    
    // Scheduling
    availabilityGeneral: [] as string[],
    availabilityOther: "",
    startDate: undefined as Date | undefined,
    clientBookingLimit: 4,
    attendanceStanding: "weekly",
    
    // Legal & Administrative
    agreedToCancellationPolicy: false,
    signedWaiver: false,
    photoRelease: false,
    smsPolicyConsent: false,
    
    // Photo/Video Permission and Signatures
    photoVideoPermission: "",
    photoVideoSignature: "",
    liabilityWaiverAgreed: false,
    liabilityWaiverSignature: "",
    cancellationPolicyAgreed: false,
    cancellationPolicySignature: "",
  });

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleMultiSelectToggle = (field: "diagnosis" | "swimGoals" | "availabilityGeneral", value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {

      // Validate required waiver fields
      if (!formData.photoVideoPermission || !formData.photoVideoSignature) {
        toast({
          title: "Missing Information",
          description: "Please complete the photo/video permission section",
          variant: "destructive",
        });
        return;
      }

      if (!formData.liabilityWaiverAgreed || !formData.liabilityWaiverSignature) {
        toast({
          title: "Missing Information",
          description: "Please complete the liability waiver section",
          variant: "destructive",
        });
        return;
      }

      if (!formData.cancellationPolicyAgreed || !formData.cancellationPolicySignature) {
        toast({
          title: "Missing Information",
          description: "Please complete the cancellation policy section",
          variant: "destructive",
        });
        return;
      }

      // Update swimmer record with enrollment details and waivers
      const swimmerData = {
        parent_phone: formData.parentPhone,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        diagnosis: formData.diagnosis,
        non_ambulatory: formData.nonAmbulatory,
        history_of_seizures: formData.historyOfSeizures,
        has_allergies: formData.hasAllergies,
        allergies_description: formData.allergiesDescription,
        has_medical_conditions: formData.hasMedicalConditions,
        medical_conditions_description: formData.medicalConditionsDescription,
        toilet_trained: formData.toiletTrained,
        other_therapies: formData.otherTherapies,
        therapies_description: formData.therapiesDescription,
        comfortable_in_water: formData.comfortableInWater,
        self_injurious_behavior: formData.selfInjuriousBehavior,
        self_injurious_description: formData.selfInjuriousDescription,
        aggressive_behavior: formData.aggressiveBehavior,
        aggressive_behavior_description: formData.aggressiveBehaviorDescription,
        elopement_history: formData.elopementHistory,
        elopement_description: formData.elopementDescription,
        has_behavior_plan: formData.hasBehaviorPlan,
        behavior_plan_description: formData.behaviorPlanDescription,
        previous_swim_lessons: formData.previousSwimLessons,
        swim_goals: formData.swimGoals,
        strengths_interests: formData.strengthsInterests,
        motivation_factors: formData.motivators,
        availability_general: formData.availabilityGeneral,
        availability_other: formData.availabilityOther,
        start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
        client_booking_limit: formData.clientBookingLimit,
        attendance_standing: formData.attendanceStanding,
        photo_release: formData.photoVideoPermission === "yes",
        photo_video_signature: formData.photoVideoSignature,
        liability_waiver_signature: formData.liabilityWaiverSignature,
        cancellation_policy_signature: formData.cancellationPolicySignature,
        enrollment_completed: true,
      };

      if (swimmerId) {
        // Update existing swimmer
        await swimmersApi.update(swimmerId, swimmerData);
      } else {
        // This shouldn't happen in normal flow, but handle it gracefully
        toast({
          title: "Error",
          description: "No swimmer ID provided. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Enrollment Complete",
        description: "Your enrollment information and waivers have been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving enrollment:", error);
      toast({
        title: "Error",
        description: "Failed to save enrollment information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BasicInfoSection
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <MedicalSafetySection
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        onMultiSelectToggle={handleMultiSelectToggle}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <SwimmingBackgroundSection
        formData={formData}
        onMultiSelectToggle={handleMultiSelectToggle}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <FunctionalInfoSection
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <OtherTherapiesSection
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <VmrcCoordinatorSection
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <SchedulingSection
        formData={formData}
        onMultiSelectToggle={handleMultiSelectToggle}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <PhotoPermissionSection
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <LiabilityWaiverSection
        formData={formData}
        onViewWaiver={() => setWaiverModalOpen(true)}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <CancellationPolicySection
        formData={formData}
        onViewPolicy={() => setCancellationPolicyModalOpen(true)}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      />

      <LiabilityWaiverModal open={waiverModalOpen} onOpenChange={setWaiverModalOpen} />
      <CancellationPolicyAgreementModal open={cancellationPolicyModalOpen} onOpenChange={setCancellationPolicyModalOpen} />

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" size="lg">
          Save Draft
        </Button>
        <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Enrollment"}
        </Button>
      </div>
    </div>
  );
};
