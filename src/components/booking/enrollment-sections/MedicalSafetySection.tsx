import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const DIAGNOSIS_OPTIONS = [
  "Autism",
  "Speech Delay",
  "ADD/ADHD",
  "Sensory Processing",
  "Developmental Disability",
  "Learning Disability",
];

interface MedicalSafetySectionProps {
  formData: {
    historyOfSeizures: boolean;
    hasAllergies: boolean;
    allergiesDescription: string;
    hasMedicalConditions: boolean;
    medicalConditionsDescription: string;
    diagnosis: string[];
    selfInjuriousBehavior: boolean;
    selfInjuriousDescription: string;
    aggressiveBehavior: boolean;
    aggressiveBehaviorDescription: string;
    elopementHistory: boolean;
    elopementDescription: string;
    hasBehaviorPlan: boolean;
    behaviorPlanDescription: string;
    restraintHistory: boolean;
    restraintDescription: string;
  };
  onCheckboxChange: (field: string, checked: boolean) => void;
  onMultiSelectToggle: (field: string, value: string) => void;
  onChange: (field: string, value: string) => void;
}

export const MedicalSafetySection = ({ formData, onCheckboxChange, onMultiSelectToggle, onChange }: MedicalSafetySectionProps) => {
  return (
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
              onCheckedChange={(checked) => onCheckboxChange("historyOfSeizures", checked as boolean)}
            />
            <Label htmlFor="historyOfSeizures" className="font-normal">History of Seizures</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasAllergies"
                checked={formData.hasAllergies}
                onCheckedChange={(checked) => onCheckboxChange("hasAllergies", checked as boolean)}
              />
              <Label htmlFor="hasAllergies" className="font-normal">Child has allergies</Label>
            </div>
            {formData.hasAllergies && (
              <Textarea
                placeholder="Please describe the allergies..."
                value={formData.allergiesDescription}
                onChange={(e) => onChange("allergiesDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasMedicalConditions"
                checked={formData.hasMedicalConditions}
                onCheckedChange={(checked) => onCheckboxChange("hasMedicalConditions", checked as boolean)}
              />
              <Label htmlFor="hasMedicalConditions" className="font-normal">Other Medical Conditions</Label>
            </div>
            {formData.hasMedicalConditions && (
              <Textarea
                placeholder="Please describe the medical conditions..."
                value={formData.medicalConditionsDescription}
                onChange={(e) => onChange("medicalConditionsDescription", e.target.value)}
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
                    onCheckedChange={() => onMultiSelectToggle("diagnosis", option)}
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
                onCheckedChange={(checked) => onCheckboxChange("selfInjuriousBehavior", checked as boolean)}
              />
              <Label htmlFor="selfInjuriousBehavior" className="font-normal">Self-Injurious Behavior</Label>
            </div>
            {formData.selfInjuriousBehavior && (
              <Textarea
                placeholder="Please describe..."
                value={formData.selfInjuriousDescription}
                onChange={(e) => onChange("selfInjuriousDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="aggressiveBehavior"
                checked={formData.aggressiveBehavior}
                onCheckedChange={(checked) => onCheckboxChange("aggressiveBehavior", checked as boolean)}
              />
              <Label htmlFor="aggressiveBehavior" className="font-normal">Aggressive Behavior</Label>
            </div>
            {formData.aggressiveBehavior && (
              <Textarea
                placeholder="Please describe..."
                value={formData.aggressiveBehaviorDescription}
                onChange={(e) => onChange("aggressiveBehaviorDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="elopementHistory"
                checked={formData.elopementHistory}
                onCheckedChange={(checked) => onCheckboxChange("elopementHistory", checked as boolean)}
              />
              <Label htmlFor="elopementHistory" className="font-normal">Elopement History</Label>
            </div>
            {formData.elopementHistory && (
              <Textarea
                placeholder="Please describe..."
                value={formData.elopementDescription}
                onChange={(e) => onChange("elopementDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasBehaviorPlan"
                checked={formData.hasBehaviorPlan}
                onCheckedChange={(checked) => onCheckboxChange("hasBehaviorPlan", checked as boolean)}
              />
              <Label htmlFor="hasBehaviorPlan" className="font-normal">Safety/Behavior Plan</Label>
            </div>
            {formData.hasBehaviorPlan && (
              <Textarea
                placeholder="Please describe the behavior plan..."
                value={formData.behaviorPlanDescription}
                onChange={(e) => onChange("behaviorPlanDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="restraintHistory"
                checked={formData.restraintHistory}
                onCheckedChange={(checked) => onCheckboxChange("restraintHistory", checked as boolean)}
              />
              <Label htmlFor="restraintHistory" className="font-normal">Restraint History</Label>
            </div>
            {formData.restraintHistory && (
              <Textarea
                placeholder="Please describe..."
                value={formData.restraintDescription}
                onChange={(e) => onChange("restraintDescription", e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
