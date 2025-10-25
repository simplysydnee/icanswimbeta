import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { addMonths, startOfMonth, format } from "date-fns";
import { BookingHeader } from "@/components/BookingHeader";
import { WeeklyBookingTab } from "@/components/booking/WeeklyBookingTab";
import { FloatingSessionsTab } from "@/components/booking/FloatingSessionsTab";
import { AssessmentTab } from "@/components/booking/AssessmentTab";

const Booking = () => {
  // Mock swimmer data for demo - replace with real auth context later
  const mockSwimmer = {
    id: "demo-swimmer-123",
    firstName: "Emma",
    lastName: "Wilson",
    photoUrl: undefined,
    currentLevel: "Minnow",
    enrollmentStatus: "enrolled" as "waitlist" | "approved" | "enrolled",
    assessmentStatus: "complete" as "not_started" | "scheduled" | "complete",
    progressPercentage: 65,
  };

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Determine which tabs should be visible based on swimmer status
  const showAssessmentOnly = 
    mockSwimmer.enrollmentStatus === "waitlist" || 
    (mockSwimmer.enrollmentStatus === "approved" && mockSwimmer.assessmentStatus !== "complete");

  const showWeeklyAndFloating = 
    mockSwimmer.enrollmentStatus === "enrolled" && 
    mockSwimmer.assessmentStatus === "complete";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <BookingHeader
          swimmerName={`${mockSwimmer.firstName} ${mockSwimmer.lastName}`}
          swimmerPhotoUrl={mockSwimmer.photoUrl}
          currentLevel={mockSwimmer.currentLevel}
          enrollmentStatus={mockSwimmer.enrollmentStatus}
          assessmentStatus={mockSwimmer.assessmentStatus}
          progressPercentage={mockSwimmer.progressPercentage}
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
            <WeeklyBookingTab 
              currentMonth={currentMonth}
              swimmerId={mockSwimmer.id}
              parentId={mockSwimmer.id} // TODO: Get actual parent ID from auth
            />
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
