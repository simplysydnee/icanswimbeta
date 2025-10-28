import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, XCircle } from "lucide-react";
import { SwimmerSessionsSummary } from "@/hooks/useUpcomingSessions";
import { CancellationPolicyModal } from "@/components/CancellationPolicyModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpcomingSessionsCardProps {
  swimmerSession: SwimmerSessionsSummary;
}

export const UpcomingSessionsCard = ({ swimmerSession }: UpcomingSessionsCardProps) => {
  const { swimmerName, photoUrl, sessions, remainingSessions, isVmrcClient } = swimmerSession;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isWithin24Hours, setIsWithin24Hours] = useState(false);
  
  const initials = swimmerName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  const handleCancelClick = (session: any) => {
    const sessionStart = new Date(session.sessionStartTimeISO);
    const now = new Date();
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    setSelectedSession(session);
    setIsWithin24Hours(hoursUntilSession < 24);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSession) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      // Log the cancellation attempt
      await supabase.from("session_logs").insert({
        user_id: user.data.user.id,
        session_id: selectedSession.id,
        booking_id: selectedSession.bookingId,
        action: "cancel_attempt",
        allowed: !isWithin24Hours,
        reason: isWithin24Hours ? "Blocked: Within 24 hours" : "Allowed: More than 24 hours notice",
      });

      if (isWithin24Hours) {
        toast({
          title: "Cancellation Not Allowed",
          description: "You cannot cancel a session within 24 hours of the start time.",
          variant: "destructive",
        });
        setShowCancelModal(false);
        return;
      }

      // Cancel the booking
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          canceled_at: new Date().toISOString(),
          canceled_by: user.data.user.id,
          cancel_source: "parent",
          cancel_reason: "Canceled by parent through portal",
        })
        .eq("id", selectedSession.bookingId);

      if (error) throw error;

      toast({
        title: "Session Canceled",
        description: "Your session has been successfully canceled.",
      });

      setShowCancelModal(false);
      
      // Refresh the page to show updated sessions
      window.location.reload();
    } catch (error) {
      console.error("Error canceling session:", error);
      toast({
        title: "Error",
        description: "Failed to cancel session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={photoUrl} alt={swimmerName} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{swimmerName}</CardTitle>
              {isVmrcClient && (
                <Badge variant="secondary" className="mt-1">
                  VMRC Client
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Sessions Remaining</p>
            <p className="text-2xl font-bold text-primary">
              {remainingSessions === "unlimited" ? "∞" : remainingSessions}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {session.sessionType}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.sessionDate}</span>
                    </div>
                  </div>
                  <Badge
                    variant={session.bookingStatus === "confirmed" ? "default" : "secondary"}
                  >
                    {session.bookingStatus}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.sessionStartTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{session.instructor}</span>
                  </div>
                </div>
                {session.bookingStatus === "confirmed" && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelClick(session)}
                      className="w-full text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Session
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedSession && (
        <CancellationPolicyModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          onConfirm={handleConfirmCancel}
          sessionStartTime={new Date(selectedSession.sessionStartTimeISO)}
          isWithin24Hours={isWithin24Hours}
        />
      )}
    </Card>
  );
};
