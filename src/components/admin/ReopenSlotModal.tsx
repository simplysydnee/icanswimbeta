import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReopenSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  instructorName?: string;
  sessionStartTime: Date;
  onSuccess?: () => void;
}

export const ReopenSlotModal = ({
  open,
  onOpenChange,
  sessionId,
  instructorName,
  sessionStartTime,
  onSuccess,
}: ReopenSlotModalProps) => {
  const [reopenType, setReopenType] = useState<"floating" | "initial_assessment">("floating");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if instructor is Lauren or Sutton for Initial Assessment eligibility
  const canOfferInitialAssessment = 
    instructorName === "Lauren" || instructorName === "Sutton";

  const handleReopenSlot = async () => {
    setIsSubmitting(true);
    try {
      const updates: any = {
        status: "available",
        session_type: reopenType === "floating" ? "floating" : "assessment",
        session_type_detail: reopenType === "floating" ? "Floating Session" : "Initial Assessment",
      };

      const { error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("id", sessionId);

      if (error) throw error;

      // Create a floating session record if it's a floating session
      if (reopenType === "floating") {
        const { error: floatingError } = await supabase
          .from("floating_sessions")
          .insert({
            original_session_id: sessionId,
            available_until: new Date(sessionStartTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            month_year: `${sessionStartTime.getFullYear()}-${String(sessionStartTime.getMonth() + 1).padStart(2, '0')}`,
          });

        if (floatingError) throw floatingError;
      }

      toast({
        title: "Slot Reopened",
        description: `Session successfully reopened as ${reopenType === "floating" ? "Floating Session" : "Initial Assessment"}.`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error reopening slot:", error);
      toast({
        title: "Error",
        description: "Failed to reopen slot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reopen Slot As...</DialogTitle>
          <DialogDescription>
            Choose how to make this canceled session available again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reopenType} onValueChange={(value) => setReopenType(value as "floating" | "initial_assessment")}>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="floating" id="floating" />
              <Label htmlFor="floating" className="font-normal cursor-pointer">
                <div>
                  <span className="font-semibold">Floating Session</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Single pickup session available to enrolled swimmers (capacity: 1)
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem 
                value="initial_assessment" 
                id="initial_assessment"
                disabled={!canOfferInitialAssessment}
              />
              <Label 
                htmlFor="initial_assessment" 
                className={`font-normal ${canOfferInitialAssessment ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <div>
                  <span className="font-semibold">Initial Assessment</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assessment session for waitlisted/pending clients
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {!canOfferInitialAssessment && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Initial Assessments can only be offered by Lauren or Sutton.
                {instructorName && ` Current instructor: ${instructorName}`}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-primary/5 border-primary/20">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Original session time, location, and instructor will be preserved.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReopenSlot} disabled={isSubmitting}>
            {isSubmitting ? "Reopening..." : "Reopen Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
