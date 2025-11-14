import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { useAssessmentSessions } from "@/hooks/useAssessmentSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingsApi } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export interface AssessmentTabProps {
  selectedSwimmers?: Array<{
    id: string;
    name: string;
    paymentType?: "private_pay" | "vmrc" | "scholarship" | "other";
  }>;
}

export const AssessmentTab = ({ selectedSwimmers = [] }: AssessmentTabProps) => {
  const { sessions, loading, error, refetch } = useAssessmentSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, typeof sessions>();
    sessions.forEach((session) => {
      const dateKey = format(parseISO(session.start_time), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });
    return grouped;
  }, [sessions]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const handleConfirm = async () => {
    if (!selectedSession || !user || selectedSwimmers.length === 0) return;

    setBookingInProgress(true);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      // Use the first selected swimmer (for now - could be extended to handle multiple)
      const swimmerId = selectedSwimmers[0].id;

      const result = await bookingsApi.createAssessment(
        selectedSession.id,
        swimmerId,
        user.id
      );

      if (result.error) {
        console.error("Failed to create assessment booking:", result.error);
        setBookingError(result.error);
        toast({
          title: "Booking Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        console.log("Assessment booking created successfully:", result.data);
        setBookingSuccess(true);

        // Reset selection after successful booking
        setSelectedSessionId(null);

        // Refresh the sessions list to show updated availability
        await refetch();

        toast({
          title: "Assessment Booked Successfully!",
          description: `Your initial assessment has been scheduled for ${format(parseISO(selectedSession.start_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}`,
        });
      }
    } catch (error) {
      console.error("Error creating assessment booking:", error);
      const errorMessage = "An unexpected error occurred while booking your assessment";
      setBookingError(errorMessage);
      toast({
        title: "Booking Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  // Show message if no swimmer is selected
  if (selectedSwimmers.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            🔑 Complete your Initial Assessment to unlock weekly and floating sessions
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Please select a swimmer from the dropdown above to book an assessment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            🔑 Complete your Initial Assessment to unlock weekly and floating sessions
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Loading Available Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            🔑 Complete your Initial Assessment to unlock weekly and floating sessions
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>What to Expect</CardTitle>
            <CardDescription>
              Your Initial Assessment is a 45-minute one-on-one session to evaluate your swimmer's current abilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Duration:</strong> 45 minutes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>What to Bring:</strong> Swimsuit, towel, goggles (optional), water bottle
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>What We'll Do:</strong> Evaluate comfort in water, floating ability, basic skills, and discuss goals
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Price:</strong> $65 (one-time fee)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No Assessment Openings Available</strong>
            <br />
            There are currently no Initial Assessment sessions available. Please check back later or contact us for more information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          🔑 Complete your Initial Assessment to unlock weekly and floating sessions
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>What to Expect</CardTitle>
          <CardDescription>
            Your Initial Assessment is a 45-minute one-on-one session to evaluate your swimmer's current abilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Duration:</strong> 45 minutes
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>What to Bring:</strong> Swimsuit, towel, goggles (optional), water bottle
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>What We'll Do:</strong> Evaluate comfort in water, floating ability, basic skills, and discuss goals
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Price:</strong> ${sessions[0]?.price_cents ? (sessions[0].price_cents / 100).toFixed(0) : '65'} (one-time fee)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="assessment-sessions">
        <CardHeader>
          <CardTitle>Available Assessment Times</CardTitle>
          <CardDescription>
            Select a date and time for your Initial Assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(sessionsByDate.entries()).map(([dateKey, dateSessions]) => {
              const date = parseISO(dateSessions[0].start_time);
              return (
                <div key={dateKey} className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dateSessions.map((session) => (
                      <Button
                        key={session.id}
                        variant={selectedSessionId === session.id ? "default" : "outline"}
                        onClick={() => setSelectedSessionId(session.id)}
                        className="justify-start gap-2"
                        data-testid={`session-${session.id}`}
                      >
                        <Clock className="h-4 w-4" />
                        {format(parseISO(session.start_time), "h:mm a")}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-lg font-semibold mb-1">
                  {format(parseISO(selectedSession.start_time), "EEEE, MMMM d, yyyy")} at{" "}
                  {format(parseISO(selectedSession.start_time), "h:mm a")}
                </div>
                <div className="text-2xl font-bold">
                  ${(selectedSession.price_cents / 100).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Initial Assessment (45 minutes)
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleConfirm}
                data-testid="confirm-booking"
                disabled={bookingInProgress || selectedSwimmers.length === 0}
              >
                {bookingInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Assessment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
