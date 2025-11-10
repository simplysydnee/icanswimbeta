import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";

interface BookingHeaderProps {
  swimmerName: string;
  swimmerPhotoUrl?: string;
  currentLevel: string;
  enrollmentStatus: "waitlist" | "approved" | "enrolled";
  assessmentStatus: "not_started" | "scheduled" | "complete" | "pos_authorization_needed" | "pos_request_sent";
  progressPercentage?: number;
}

export const BookingHeader = ({
  swimmerName,
  swimmerPhotoUrl,
  currentLevel,
  enrollmentStatus,
  assessmentStatus,
  progressPercentage = 0,
}: BookingHeaderProps) => {
  const getStatusDisplay = () => {
    if (enrollmentStatus === "waitlist") {
      return { text: "Waitlist", variant: "secondary" as const };
    }
    if (assessmentStatus === "pos_authorization_needed") {
      return { text: "POS Authorization Needed", variant: "destructive" as const };
    }
    if (assessmentStatus === "pos_request_sent") {
      return { text: "POS Request Sent", variant: "secondary" as const };
    }
    if (enrollmentStatus === "approved" && assessmentStatus !== "complete") {
      return { text: "Approved – Book Assessment", variant: "default" as const };
    }
    return { text: "Enrolled", variant: "default" as const };
  };

  const status = getStatusDisplay();

  return (
    <header className="bg-gradient-to-r from-primary via-accent to-secondary p-6 rounded-2xl shadow-lg mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            <AvatarImage src={swimmerPhotoUrl} alt={swimmerName} />
            <AvatarFallback className="bg-white text-primary">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-white">{swimmerName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {currentLevel}
              </Badge>
              <Badge variant={status.variant} className="bg-white/90 text-primary">
                {status.text}
              </Badge>
            </div>
          </div>
        </div>
        {progressPercentage > 0 && (
          <div className="flex-1 max-w-xs">
            <div className="text-xs text-white/90 mb-1">Overall Progress</div>
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
            <div className="text-xs text-white/80 mt-1">{progressPercentage}% Complete</div>
          </div>
        )}
      </div>
    </header>
  );
};
