import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addMonths, startOfMonth } from "date-fns";
import { BookingHeader } from "@/components/BookingHeader";
import { WeeklyBookingTab } from "@/components/booking/WeeklyBookingTab";
import { FloatingSessionsTab } from "@/components/booking/FloatingSessionsTab";
import { AssessmentTab } from "@/components/booking/AssessmentTab";
import { useSwimmerStatus } from "@/hooks/useSwimmerStatus";
import logoHeader from "@/assets/logo-header.png";

const Booking = () => {
  // TODO: Get swimmer ID from auth context or URL params
  const swimmerId = "mock-swimmer-id"; // Replace with actual swimmer ID
  const { swimmer, loading, error } = useSwimmerStatus(swimmerId);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Determine which tabs should be visible based on swimmer status
  const showAssessmentOnly = 
    swimmer?.enrollmentStatus === "waitlist" || 
    (swimmer?.enrollmentStatus === "approved" && swimmer?.assessmentStatus !== "complete");

  const showWeeklyAndFloating = 
    swimmer?.enrollmentStatus === "enrolled" && 
    swimmer?.assessmentStatus === "complete";

  const handlePreviousMonth = () => {
    const now = new Date();
    const prevMonth = addMonths(currentMonth, -1);
    if (prevMonth >= startOfMonth(now)) {
      setCurrentMonth(prevMonth);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading swimmer information...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !swimmer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Unable to load swimmer information. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <BookingHeader
          swimmerName={`${swimmer.firstName} ${swimmer.lastName}`}
          swimmerPhotoUrl={swimmer.photoUrl}
          currentLevel={swimmer.currentLevel}
          enrollmentStatus={swimmer.enrollmentStatus}
          assessmentStatus={swimmer.assessmentStatus}
          progressPercentage={swimmer.progressPercentage}
        />

        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={currentMonth <= startOfMonth(new Date())}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Banner for waitlist/not assessed */}
        {showAssessmentOnly && (
          <Alert className="mb-6 border-primary">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              🔑 Complete your Initial Assessment to unlock weekly lessons and floating sessions.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Tabs */}
        <Tabs defaultValue={showAssessmentOnly ? "assessment" : "weekly"}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="weekly" disabled={!showWeeklyAndFloating}>
              Weekly (This Month)
            </TabsTrigger>
            <TabsTrigger value="floating" disabled={!showWeeklyAndFloating}>
              Floating Sessions
            </TabsTrigger>
            <TabsTrigger value="assessment" disabled={showWeeklyAndFloating}>
              Initial Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <WeeklyBookingTab currentMonth={currentMonth} />
          </TabsContent>

          <TabsContent value="floating">
            <FloatingSessionsTab />
          </TabsContent>

          <TabsContent value="assessment">
            <AssessmentTab />
          </TabsContent>
        </Tabs>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Booking;
