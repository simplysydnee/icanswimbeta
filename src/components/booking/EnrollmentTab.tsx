import { useState } from "react";
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
    // TODO: Integrate with Supabase to save enrollment data
    console.log("Enrollment data:", formData);
    toast({
      title: "Enrollment Information Saved",
      description: "The enrollment information has been successfully saved.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Basic Child Details */}
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
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Child's Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                placeholder="e.g., 65 lbs"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
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

      {/* Medical & Safety Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical & Safety Information</CardTitle>
          <CardDescription>Important health and safety details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="historyOfSeizures"
                checked={formData.historyOfSeizures}
                onCheckedChange={(checked) => handleCheckboxChange("historyOfSeizures", checked as boolean)}
              />
              <Label htmlFor="historyOfSeizures" className="font-normal">History of Seizures</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="hasAllergies"
                  checked={formData.hasAllergies}
                  onCheckedChange={(checked) => handleCheckboxChange("hasAllergies", checked as boolean)}
                />
                <Label htmlFor="hasAllergies" className="font-normal">Child has allergies</Label>
              </div>
              {formData.hasAllergies && (
                <Textarea
                  placeholder="Please describe the allergies..."
                  value={formData.allergiesDescription}
                  onChange={(e) => setFormData({ ...formData, allergiesDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="hasMedicalConditions"
                  checked={formData.hasMedicalConditions}
                  onCheckedChange={(checked) => handleCheckboxChange("hasMedicalConditions", checked as boolean)}
                />
                <Label htmlFor="hasMedicalConditions" className="font-normal">Other Medical Conditions</Label>
              </div>
              {formData.hasMedicalConditions && (
                <Textarea
                  placeholder="Please describe the medical conditions..."
                  value={formData.medicalConditionsDescription}
                  onChange={(e) => setFormData({ ...formData, medicalConditionsDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Diagnosis (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {DIAGNOSIS_OPTIONS.map((option) => (
                  <div key={option} className="flex items-start space-x-2">
                    <Checkbox
                      id={`diagnosis-${option}`}
                      checked={formData.diagnosis.includes(option)}
                      onCheckedChange={() => handleMultiSelectToggle("diagnosis", option)}
                    />
                    <Label htmlFor={`diagnosis-${option}`} className="font-normal">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="selfInjuriousBehavior"
                  checked={formData.selfInjuriousBehavior}
                  onCheckedChange={(checked) => handleCheckboxChange("selfInjuriousBehavior", checked as boolean)}
                />
                <Label htmlFor="selfInjuriousBehavior" className="font-normal">Self-Injurious Behavior</Label>
              </div>
              {formData.selfInjuriousBehavior && (
                <Textarea
                  placeholder="Please describe..."
                  value={formData.selfInjuriousDescription}
                  onChange={(e) => setFormData({ ...formData, selfInjuriousDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="aggressiveBehavior"
                  checked={formData.aggressiveBehavior}
                  onCheckedChange={(checked) => handleCheckboxChange("aggressiveBehavior", checked as boolean)}
                />
                <Label htmlFor="aggressiveBehavior" className="font-normal">Aggressive Behavior</Label>
              </div>
              {formData.aggressiveBehavior && (
                <Textarea
                  placeholder="Please describe..."
                  value={formData.aggressiveBehaviorDescription}
                  onChange={(e) => setFormData({ ...formData, aggressiveBehaviorDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="elopementHistory"
                  checked={formData.elopementHistory}
                  onCheckedChange={(checked) => handleCheckboxChange("elopementHistory", checked as boolean)}
                />
                <Label htmlFor="elopementHistory" className="font-normal">Elopement History</Label>
              </div>
              {formData.elopementHistory && (
                <Textarea
                  placeholder="Please describe..."
                  value={formData.elopementDescription}
                  onChange={(e) => setFormData({ ...formData, elopementDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="hasBehaviorPlan"
                  checked={formData.hasBehaviorPlan}
                  onCheckedChange={(checked) => handleCheckboxChange("hasBehaviorPlan", checked as boolean)}
                />
                <Label htmlFor="hasBehaviorPlan" className="font-normal">Safety/Behavior Plan</Label>
              </div>
              {formData.hasBehaviorPlan && (
                <Textarea
                  placeholder="Please describe the behavior plan..."
                  value={formData.behaviorPlanDescription}
                  onChange={(e) => setFormData({ ...formData, behaviorPlanDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="restraintHistory"
                  checked={formData.restraintHistory}
                  onCheckedChange={(checked) => handleCheckboxChange("restraintHistory", checked as boolean)}
                />
                <Label htmlFor="restraintHistory" className="font-normal">Restraint History</Label>
              </div>
              {formData.restraintHistory && (
                <Textarea
                  placeholder="Please describe..."
                  value={formData.restraintDescription}
                  onChange={(e) => setFormData({ ...formData, restraintDescription: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swimming Background & Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Swimming Background & Goals</CardTitle>
          <CardDescription>Previous experience and learning objectives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Has your child previously taken swim lessons?</Label>
            <Select
              value={formData.previousSwimLessons ? "yes" : "no"}
              onValueChange={(value) => setFormData({ ...formData, previousSwimLessons: value === "yes" })}
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
            <Label htmlFor="comfortableInWater">Comfortable in Water</Label>
            <Select value={formData.comfortableInWater} onValueChange={(value) => setFormData({ ...formData, comfortableInWater: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select comfort level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_comfortable">Very Comfortable</SelectItem>
                <SelectItem value="somewhat_comfortable">Somewhat Comfortable</SelectItem>
                <SelectItem value="not_comfortable">Not Comfortable</SelectItem>
                <SelectItem value="afraid">Afraid of Water</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>What swim skills and water safety skills would you like your child to develop? (select all that apply)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
              {SWIM_GOALS.map((goal) => (
                <div key={goal} className="flex items-start space-x-2">
                  <Checkbox
                    id={`goal-${goal}`}
                    checked={formData.swimGoals.includes(goal)}
                    onCheckedChange={() => handleMultiSelectToggle("swimGoals", goal)}
                  />
                  <Label htmlFor={`goal-${goal}`} className="font-normal text-sm">{goal}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Functional Information</CardTitle>
          <CardDescription>Communication and daily living skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Toilet Trained?</Label>
            <Select
              value={formData.toiletTrained === undefined ? "" : formData.toiletTrained.toString()}
              onValueChange={(value) => setFormData({ ...formData, toiletTrained: value === "true" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="nonAmbulatory"
              checked={formData.nonAmbulatory}
              onCheckedChange={(checked) => handleCheckboxChange("nonAmbulatory", checked as boolean)}
            />
            <Label htmlFor="nonAmbulatory" className="font-normal">Non-ambulatory (requires mobility assistance)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="communicationType">Type of Communication</Label>
            <Select value={formData.communicationType} onValueChange={(value) => setFormData({ ...formData, communicationType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select communication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal</SelectItem>
                <SelectItem value="signs">Sign Language</SelectItem>
                <SelectItem value="gestures">Gestures</SelectItem>
                <SelectItem value="pecs_aac">PECS/AAC Device</SelectItem>
                <SelectItem value="non_verbal">Non-verbal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strengthsInterests">Please describe your child's strengths, interests, and favorite activities.</Label>
            <Textarea
              id="strengthsInterests"
              placeholder="Describe your child's strengths, interests, and favorite activities..."
              value={formData.strengthsInterests}
              onChange={(e) => setFormData({ ...formData, strengthsInterests: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivators">What kinds of things motivate your child and encourage positive behavior, especially in a pool environment?</Label>
            <Textarea
              id="motivators"
              placeholder="e.g., Praise, toys, specific activities, rewards..."
              value={formData.motivators}
              onChange={(e) => setFormData({ ...formData, motivators: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Other Therapies */}
      <Card>
        <CardHeader>
          <CardTitle>Other Therapies</CardTitle>
          <CardDescription>Additional therapeutic services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="otherTherapies"
                checked={formData.otherTherapies}
                onCheckedChange={(checked) => handleCheckboxChange("otherTherapies", checked as boolean)}
              />
              <Label htmlFor="otherTherapies" className="font-normal">Child receives other therapies</Label>
            </div>
            {formData.otherTherapies && (
              <Textarea
                placeholder="Please describe the therapies (e.g., OT, PT, Speech)..."
                value={formData.therapiesDescription}
                onChange={(e) => setFormData({ ...formData, therapiesDescription: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* VMRC Information */}
      <Card>
        <CardHeader>
          <CardTitle>VMRC Coordinator Information</CardTitle>
          <CardDescription>For VMRC clients only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vmrcCoordinatorName">VMRC Coordinator Name</Label>
              <Input
                id="vmrcCoordinatorName"
                placeholder="Coordinator name"
                value={formData.vmrcCoordinatorName}
                onChange={(e) => setFormData({ ...formData, vmrcCoordinatorName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vmrcCoordinatorEmail">Coordinator Email</Label>
              <Input
                id="vmrcCoordinatorEmail"
                type="email"
                placeholder="coordinator@example.com"
                value={formData.vmrcCoordinatorEmail}
                onChange={(e) => setFormData({ ...formData, vmrcCoordinatorEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vmrcCoordinatorPhone">Coordinator Phone</Label>
              <Input
                id="vmrcCoordinatorPhone"
                placeholder="(555) 123-4567"
                value={formData.vmrcCoordinatorPhone}
                onChange={(e) => setFormData({ ...formData, vmrcCoordinatorPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling & Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling & Availability</CardTitle>
          <CardDescription>Preferred lesson times and schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>What is your general availability for swim lessons? (select all that apply)</Label>
            <div className="grid grid-cols-1 gap-2 p-2 border rounded-md">
              {AVAILABILITY_SLOTS.map((slot) => (
                <div key={slot} className="flex items-start space-x-2">
                  <Checkbox
                    id={`avail-${slot}`}
                    checked={formData.availabilityGeneral.includes(slot)}
                    onCheckedChange={() => handleMultiSelectToggle("availabilityGeneral", slot)}
                  />
                  <Label htmlFor={`avail-${slot}`} className="font-normal text-sm">{slot}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityOther">Availability Other (please specify)</Label>
            <Textarea
              id="availabilityOther"
              placeholder="Any additional scheduling notes..."
              value={formData.availabilityOther}
              onChange={(e) => setFormData({ ...formData, availabilityOther: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendanceStanding">Attendance Standing</Label>
              <Select value={formData.attendanceStanding} onValueChange={(value) => setFormData({ ...formData, attendanceStanding: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="floating">Floating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientBookingLimit">Client Booking Limit</Label>
              <Input
                id="clientBookingLimit"
                type="number"
                min={1}
                max={12}
                value={formData.clientBookingLimit}
                onChange={(e) => setFormData({ ...formData, clientBookingLimit: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Administrative */}
      <Card>
        <CardHeader>
          <CardTitle>Legal & Administrative</CardTitle>
          <CardDescription>Required agreements and policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreedToCancellationPolicy"
                checked={formData.agreedToCancellationPolicy}
                onCheckedChange={(checked) => handleCheckboxChange("agreedToCancellationPolicy", checked as boolean)}
              />
              <Label htmlFor="agreedToCancellationPolicy" className="font-normal">
                I agree to the Cancellation Policy
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="signedWaiver"
                checked={formData.signedWaiver}
                onCheckedChange={(checked) => handleCheckboxChange("signedWaiver", checked as boolean)}
              />
              <Label htmlFor="signedWaiver" className="font-normal">
                Signed Liability Waiver
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="photoRelease"
                checked={formData.photoRelease}
                onCheckedChange={(checked) => handleCheckboxChange("photoRelease", checked as boolean)}
              />
              <Label htmlFor="photoRelease" className="font-normal">
                Photo Release Authorization
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="smsPolicyConsent"
                checked={formData.smsPolicyConsent}
                onCheckedChange={(checked) => handleCheckboxChange("smsPolicyConsent", checked as boolean)}
              />
              <Label htmlFor="smsPolicyConsent" className="font-normal">
                SMS Policy Consent (receive text message notifications)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" size="lg">
          Save Draft
        </Button>
        <Button size="lg" onClick={handleSubmit}>
          Submit Enrollment
        </Button>
      </div>
    </div>
  );
};
