import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "lucide-react";

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  currentLevel: string;
  enrollmentStatus: "waitlist" | "approved" | "enrolled";
  assessmentStatus: "not_started" | "scheduled" | "complete";
  isVmrcClient?: boolean;
  paymentType?: "private_pay" | "vmrc" | "scholarship" | "other";
  vmrcSessionsUsed?: number;
  vmrcSessionsAuthorized?: number;
  vmrcCurrentPosNumber?: string | null;
}

interface SwimmerSelectorProps {
  swimmers: Swimmer[];
  selectedSwimmerIds: string[];
  onSwimmersChange: (swimmerIds: string[]) => void;
}

export const SwimmerSelector = ({
  swimmers,
  selectedSwimmerIds,
  onSwimmersChange,
}: SwimmerSelectorProps) => {
  const handleToggleSwimmer = (swimmerId: string) => {
    const swimmer = swimmers.find((s) => s.id === swimmerId);
    
    // Check VMRC authorization (only block if not waitlist or approved needing assessment)
    if (
      swimmer?.enrollmentStatus !== "waitlist" &&
      !(swimmer?.enrollmentStatus === "approved" && swimmer?.assessmentStatus !== "complete") &&
      swimmer?.paymentType === "vmrc" &&
      swimmer.vmrcSessionsUsed !== undefined &&
      swimmer.vmrcSessionsAuthorized !== undefined &&
      swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized
    ) {
      // Don't allow selection if VMRC auth is needed
      return;
    }

    if (selectedSwimmerIds.includes(swimmerId)) {
      onSwimmersChange(selectedSwimmerIds.filter((id) => id !== swimmerId));
    } else {
      onSwimmersChange([...selectedSwimmerIds, swimmerId]);
    }
  };

  const getStatusDisplay = (swimmer: Swimmer) => {
    // Check if VMRC client has used all sessions
    if (
      swimmer.paymentType === "vmrc" &&
      swimmer.vmrcSessionsUsed !== undefined &&
      swimmer.vmrcSessionsAuthorized !== undefined &&
      swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized
    ) {
      return { text: "Progress Update Needed", variant: "destructive" as const };
    }
    if (swimmer.enrollmentStatus === "waitlist") {
      return { text: "Waitlist — Assessment Required", variant: "destructive" as const };
    }
    if (swimmer.enrollmentStatus === "approved" && swimmer.assessmentStatus !== "complete") {
      return { text: "Assessment Needed", variant: "destructive" as const };
    }
    return { text: "Active — Eligible for Bookings", variant: "default" as const };
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {swimmers.length === 1
            ? "Swimmer"
            : "Select Swimmer(s) to Book"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {swimmers.map((swimmer) => {
            const status = getStatusDisplay(swimmer);
            const isSelected = selectedSwimmerIds.includes(swimmer.id);
            
            // Swimmers can book if: waitlist, approved needing assessment, or enrolled with complete assessment
            const canBook =
              swimmer.enrollmentStatus === "waitlist" ||
              (swimmer.enrollmentStatus === "approved" && swimmer.assessmentStatus !== "complete") ||
              (swimmer.enrollmentStatus === "enrolled" &&
                swimmer.assessmentStatus === "complete" &&
                !(
                  swimmer.paymentType === "vmrc" &&
                  swimmer.vmrcSessionsUsed !== undefined &&
                  swimmer.vmrcSessionsAuthorized !== undefined &&
                  swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized
                ));

            const needsVmrcAuth =
              swimmer.enrollmentStatus !== "waitlist" &&
              !(swimmer.enrollmentStatus === "approved" && swimmer.assessmentStatus !== "complete") &&
              swimmer.paymentType === "vmrc" &&
              swimmer.vmrcSessionsUsed !== undefined &&
              swimmer.vmrcSessionsAuthorized !== undefined &&
              swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized;

            return (
              <Card
                key={swimmer.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${!canBook ? "opacity-60" : ""}`}
                onClick={() => canBook && handleToggleSwimmer(swimmer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {swimmers.length > 1 && canBook && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSwimmer(swimmer.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                    )}
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={swimmer.photoUrl} alt={swimmer.firstName} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5 sm:h-6 sm:w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate">
                        {swimmer.firstName} {swimmer.lastName}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {swimmer.currentLevel}
                        </Badge>
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                        {swimmer.paymentType === "vmrc" && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            VMRC
                          </Badge>
                        )}
                        {swimmer.paymentType === "private_pay" && (
                          <Badge variant="outline" className="text-xs">
                            Private Pay
                          </Badge>
                        )}
                      </div>
                      {!canBook && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {needsVmrcAuth
                            ? "Progress Update Needed"
                            : "Complete assessment first"}
                        </div>
                      )}
                      {swimmer.enrollmentStatus === "waitlist" && (
                        <div className="text-xs text-primary mt-1 font-medium">
                          Assessment booking available
                        </div>
                      )}
                      {swimmer.enrollmentStatus === "approved" && swimmer.assessmentStatus !== "complete" && (
                        <div className="text-xs text-primary mt-1 font-medium">
                          Assessment booking available
                        </div>
                      )}
                      {canBook && swimmer.paymentType === "vmrc" && (
                        <div className="text-xs text-primary mt-1">
                          Sessions used: {swimmer.vmrcSessionsUsed}/{swimmer.vmrcSessionsAuthorized}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedSwimmerIds.length > 1 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium text-primary">
              🎉 Booking for {selectedSwimmerIds.length} swimmers
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              You'll book the same sessions for all selected swimmers
            </div>
          </div>
        )}

        {selectedSwimmerIds.length === 0 && swimmers.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground text-center">
            {swimmers.some(
              (s) =>
                s.enrollmentStatus === "enrolled" &&
                s.assessmentStatus === "complete"
            )
              ? "Select at least one swimmer to continue"
              : "No swimmers ready to book yet"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
